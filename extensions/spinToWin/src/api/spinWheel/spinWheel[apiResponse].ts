/**
 * POST /spin-wheel — execute a spin on the wheel.
 * Reward is selected server-side. Frontend never decides.
 */
import {
  commit,
  rollback,
  startTransaction
} from '@evershop/postgres-query-builder';
import { pool, getConnection } from '@evershop/evershop/lib/postgres';
import {
  isModuleEnabledSync,
  isModuleAvailableInContract
} from '../../../../moduleManager/dist/services/moduleRegistry.js';
import {
  getSpinSettings,
  getActiveRewards,
  selectRewardByProbability,
  checkSpinAllowed,
  generateCouponForReward,
  recordSpin,
  hashValue
} from '../../services/spinService.js';

export default async function spinWheel(request, response) {
  // ── Module guard ──
  if (!isModuleAvailableInContract('spinToWin')) {
    return response.status(403).json({
      error: 'MODULE_NOT_INCLUDED',
      message: 'Ce module n\'est pas inclus dans votre contrat.'
    });
  }
  if (!isModuleEnabledSync('spinToWin')) {
    return response.status(403).json({
      error: 'MODULE_DISABLED',
      message: 'Ce module est désactivé pour ce magasin.'
    });
  }

  const settings = await getSpinSettings();

  // Check if module is enabled in settings
  if (settings.enabled !== '1' && settings.enabled !== 'true') {
    return response.status(403).json({
      error: 'MODULE_DISABLED',
      message: 'La roue de chance est désactivée.'
    });
  }

  // Build identifiers
  const ip = request.headers['x-forwarded-for'] || request.socket?.remoteAddress || '';
  const ua = request.headers['user-agent'] || '';
  const customerId = request.locals?.customer?.customer_id || null;
  const ipHash = ip ? hashValue(ip) : null;
  const userAgentHash = ua ? hashValue(ua) : null;

  // Login required — spin only allowed for logged-in customers
  if (!customerId) {
    return response.status(401).json({
      error: { message: 'Veuillez vous connecter pour tourner la roue.' }
    });
  }

  // Auto-fill email/phone from logged-in customer (never ask from frontend)
  const customerRow = await pool.query(
    'SELECT email, full_name FROM customer WHERE customer_id = $1',
    [customerId]
  );
  const email = customerRow.rows[0]?.email || request.body.email || '';
  const phone = request.body.phone || '';

  // Check spin limits
  const spinCheck = await checkSpinAllowed(
    { customerId, email, phone, ipHash, userAgentHash },
    settings
  );
  if (!spinCheck.allowed) {
    return response.status(429).json({
      error: { message: spinCheck.reason }
    });
  }

  // Get active rewards
  const rewards = await getActiveRewards();
  if (!rewards || rewards.length === 0) {
    return response.status(500).json({
      error: { message: 'Aucune récompense disponible.' }
    });
  }

  // Select reward server-side
  const selectedReward = selectRewardByProbability(rewards);
  if (!selectedReward) {
    return response.status(500).json({
      error: { message: 'Erreur lors de la sélection de la récompense.' }
    });
  }

  // Generate coupon if needed (in transaction)
  const connection = await getConnection(pool);
  let couponCode = null;

  try {
    await startTransaction(connection);

    if (selectedReward.reward_type !== 'no_win') {
      couponCode = await generateCouponForReward(selectedReward, connection);
    }

    // Record the spin
    await recordSpin(
      {
        customerId,
        email,
        phone,
        ipHash,
        userAgentHash,
        rewardId: selectedReward.reward_id,
        couponCode
      },
      connection
    );

    await commit(connection);
  } catch (err) {
    await rollback(connection);
    return response.status(500).json({
      error: { message: 'Erreur lors de l\'enregistrement du tour.' }
    });
  }

  // Return result
  const isWin = selectedReward.reward_type !== 'no_win';
  return response.json({
    data: {
      won: isWin,
      reward: {
        label: selectedReward.label,
        type: selectedReward.reward_type,
        value: parseFloat(selectedReward.value)
      },
      couponCode: couponCode || null,
      message: isWin ? settings.successMessage : settings.failureMessage
    }
  });
}
