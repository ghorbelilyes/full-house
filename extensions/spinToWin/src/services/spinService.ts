/**
 * Spin-to-Win service — reward selection, spin validation, coupon generation.
 * All reward logic runs server-side; the frontend never decides.
 */
import { createHash, randomBytes } from 'crypto';
import {
  select,
  insert,
  PoolClient
} from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';
import { getSetting } from '@evershop/evershop/setting/services';

/* ── Helpers ── */

export function hashValue(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateCouponCode(prefix: string): string {
  const rand = randomBytes(4).toString('hex').toUpperCase();
  return prefix ? `${prefix}-${rand}` : `STW-${rand}`;
}

/* ── Settings helpers ── */

export async function getSpinSettings() {
  return {
    enabled: await getSetting('stw_enabled', '0'),
    popupTitle: await getSetting('stw_popup_title', 'Tentez votre chance'),
    popupSubtitle: await getSetting('stw_popup_subtitle', 'Tournez la roue et gagnez une remise'),
    buttonText: await getSetting('stw_button_text', 'Tourner la roue'),
    successMessage: await getSetting('stw_success_message', 'Félicitations !'),
    failureMessage: await getSetting('stw_failure_message', 'Essayez encore'),
    triggerType: await getSetting('stw_trigger_type', 'delay'),
    triggerDelay: parseInt(await getSetting('stw_trigger_delay', '5'), 10),
    showOnPages: JSON.parse(await getSetting('stw_show_on_pages', '["homepage","productView","categoryView"]')),
    inputRequired: await getSetting('stw_input_required', 'email'),
    allowGuest: await getSetting('stw_allow_guest', '1'),
    requireLogin: await getSetting('stw_require_login', '0'),
    maxSpinsVisitor: parseInt(await getSetting('stw_max_spins_visitor', '1'), 10),
    maxSpinsCustomer: parseInt(await getSetting('stw_max_spins_customer', '3'), 10),
    cooldown: await getSetting('stw_cooldown', 'once_forever'),
    mainColor: await getSetting('stw_main_color', '#e11d48'),
    bgColor: await getSetting('stw_bg_color', '#ffffff'),
    textColor: await getSetting('stw_text_color', '#1e293b'),
    buttonColor: await getSetting('stw_button_color', '#e11d48'),
    wheelColors: JSON.parse(await getSetting('stw_wheel_colors', '["#e11d48","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ec4899","#14b8a6"]')),
    soundEnabled: await getSetting('stw_sound_enabled', '1'),
    confettiEnabled: await getSetting('stw_confetti_enabled', '1'),
    termsText: await getSetting('stw_terms_text', '')
  };
}

/* ── Get active rewards ── */

export async function getActiveRewards() {
  const query = select().from('spin_to_win_reward');
  query.where('active', '=', true);
  query.orderBy('sort_order', 'ASC');
  const rewards = await query.execute(pool);
  return rewards;
}

/* ── Select reward using weighted random ── */

export function selectRewardByProbability(rewards: any[]): any | null {
  if (!rewards || rewards.length === 0) return null;

  const totalProb = rewards.reduce(
    (sum, r) => sum + parseFloat(r.probability),
    0
  );
  if (totalProb <= 0) return null;

  const rand = Math.random() * totalProb;
  let cumulative = 0;

  for (const reward of rewards) {
    cumulative += parseFloat(reward.probability);
    if (rand <= cumulative) return reward;
  }

  return rewards[rewards.length - 1];
}

/* ── Cooldown check ── */

export async function checkSpinAllowed(
  identifiers: {
    customerId?: number;
    email?: string;
    phone?: string;
    ipHash?: string;
    userAgentHash?: string;
  },
  settings: Awaited<ReturnType<typeof getSpinSettings>>
): Promise<{ allowed: boolean; reason?: string }> {
  const { cooldown, maxSpinsVisitor, maxSpinsCustomer } = settings;

  // Build time constraint
  let timeConstraint = '';
  if (cooldown === 'once_per_session') {
    timeConstraint = `AND "created_at" > NOW() - INTERVAL '1 hour'`;
  } else if (cooldown === 'once_per_day') {
    timeConstraint = `AND "created_at" > NOW() - INTERVAL '1 day'`;
  } else if (cooldown === 'once_per_week') {
    timeConstraint = `AND "created_at" > NOW() - INTERVAL '7 days'`;
  }
  // once_forever => no time constraint

  // Check customer spins
  if (identifiers.customerId) {
    const maxSpins = maxSpinsCustomer;
    const result = await pool.query(
      `SELECT COUNT(*) as cnt FROM "spin_to_win_spin"
       WHERE "customer_id" = $1 ${timeConstraint}`,
      [identifiers.customerId]
    );
    const count = parseInt(result.rows[0]?.cnt || '0', 10);
    if (count >= maxSpins) {
      return { allowed: false, reason: 'Vous avez atteint le nombre maximum de tours.' };
    }
    return { allowed: true };
  }

  // Check by email
  if (identifiers.email) {
    const result = await pool.query(
      `SELECT COUNT(*) as cnt FROM "spin_to_win_spin"
       WHERE "email" = $1 ${timeConstraint}`,
      [identifiers.email]
    );
    const count = parseInt(result.rows[0]?.cnt || '0', 10);
    if (count >= maxSpinsVisitor) {
      return { allowed: false, reason: 'Vous avez atteint le nombre maximum de tours.' };
    }
  }

  // Check by phone
  if (identifiers.phone) {
    const result = await pool.query(
      `SELECT COUNT(*) as cnt FROM "spin_to_win_spin"
       WHERE "phone" = $1 ${timeConstraint}`,
      [identifiers.phone]
    );
    const count = parseInt(result.rows[0]?.cnt || '0', 10);
    if (count >= maxSpinsVisitor) {
      return { allowed: false, reason: 'Vous avez atteint le nombre maximum de tours.' };
    }
  }

  // Check by IP hash
  if (identifiers.ipHash) {
    const result = await pool.query(
      `SELECT COUNT(*) as cnt FROM "spin_to_win_spin"
       WHERE "ip_hash" = $1 ${timeConstraint}`,
      [identifiers.ipHash]
    );
    const count = parseInt(result.rows[0]?.cnt || '0', 10);
    if (count >= maxSpinsVisitor) {
      return { allowed: false, reason: 'Vous avez atteint le nombre maximum de tours.' };
    }
  }

  return { allowed: true };
}

/* ── Generate coupon for a reward ── */

export async function generateCouponForReward(
  reward: any,
  connection: PoolClient
): Promise<string | null> {
  if (reward.reward_type === 'no_win') return null;

  const code = generateCouponCode(reward.coupon_prefix || 'STW');

  const expiryDays = reward.coupon_expiry_days || 30;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + expiryDays);

  let discountType = 'percentage';
  let discountAmount = parseFloat(reward.value) || 0;
  let freeShipping = false;

  if (reward.reward_type === 'free_shipping') {
    freeShipping = true;
    discountType = 'fixed_discount_to_entire_order';
    discountAmount = 0;
  } else if (reward.reward_type === 'fixed_discount') {
    discountType = 'fixed_discount_to_entire_order';
  } else if (reward.reward_type === 'percentage_discount') {
    discountType = 'percentage_discount_to_entire_order';
  } else if (reward.reward_type === 'gift_product') {
    discountType = 'fixed_discount_to_entire_order';
    discountAmount = 0;
  }

  const minOrderAmount = parseFloat(reward.min_order_amount) || 0;
  const condition = minOrderAmount > 0
    ? JSON.stringify({ order_total: minOrderAmount })
    : null;

  await insert('coupon')
    .given({
      status: true,
      description: `Roue de chance: ${reward.label}`,
      discount_amount: discountAmount,
      free_shipping: freeShipping,
      discount_type: discountType,
      coupon: code,
      max_uses_time_per_coupon: reward.max_usage || 1,
      max_uses_time_per_customer: 1,
      end_date: endDate.toISOString(),
      condition
    })
    .execute(connection, false);

  return code;
}

/* ── Record a spin ── */

export async function recordSpin(
  data: {
    customerId?: number;
    email?: string;
    phone?: string;
    ipHash?: string;
    userAgentHash?: string;
    rewardId: number;
    couponCode?: string;
  },
  connection: PoolClient
) {
  await insert('spin_to_win_spin')
    .given({
      customer_id: data.customerId || null,
      email: data.email || null,
      phone: data.phone || null,
      ip_hash: data.ipHash || null,
      user_agent_hash: data.userAgentHash || null,
      reward_id: data.rewardId,
      coupon_code: data.couponCode || null
    })
    .execute(connection, false);
}
