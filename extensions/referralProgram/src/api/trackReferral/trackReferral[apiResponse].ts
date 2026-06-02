/**
 * POST /referral/track — track a referral visit and link to order/customer.
 * Called from frontend when ?ref=CODE is detected, and optionally at checkout.
 */
import { pool } from '@evershop/evershop/lib/postgres';
import {
  isModuleEnabledSync,
  isModuleAvailableInContract
} from '../../../../moduleManager/dist/services/moduleRegistry.js';
import {
  trackReferralVisit,
  findReferrerByCode,
  createReferral,
  hashValue
} from '../../services/referralService.js';

export default async function trackReferral(request, response) {
  // Module guard
  if (!isModuleAvailableInContract('referralProgram')) {
    return response.status(403).json({
      error: 'MODULE_NOT_INCLUDED',
      message: 'Ce module n\'est pas inclus dans votre contrat.'
    });
  }
  if (!isModuleEnabledSync('referralProgram')) {
    return response.status(403).json({
      error: 'MODULE_DISABLED',
      message: 'Ce module est désactivé pour ce magasin.'
    });
  }

  const { referralCode, landingPage, action, orderId } = request.body;

  if (!referralCode) {
    return response.status(400).json({
      error: { message: 'Code de parrainage requis.' }
    });
  }

  const ip = request.headers['x-forwarded-for'] || request.socket?.remoteAddress || '';
  const ua = request.headers['user-agent'] || '';
  const ipHash = ip ? hashValue(ip) : null;
  const userAgentHash = ua ? hashValue(ua) : null;

  try {
    // If action is 'visit', track the visit
    if (!action || action === 'visit') {
      const result = await trackReferralVisit(
        referralCode,
        ipHash,
        userAgentHash,
        landingPage || '/'
      );
      return response.json({ data: { tracked: result.success } });
    }

    // If action is 'link_order', link a referral to an order
    if (action === 'link_order') {
      const customerId = request.locals?.customer?.customer_id;
      const codeRow = await findReferrerByCode(referralCode);

      if (!codeRow) {
        return response.json({ data: { linked: false, reason: 'Code invalide.' } });
      }

      // Prevent self-referral
      if (customerId && codeRow.customer_id === customerId) {
        return response.json({ data: { linked: false, reason: 'Auto-parrainage non autorisé.' } });
      }

      const created = await createReferral(
        codeRow.customer_id,
        customerId || null,
        null,
        orderId ? parseInt(orderId, 10) : null
      );

      return response.json({ data: { linked: created } });
    }

    return response.status(400).json({
      error: { message: 'Action invalide.' }
    });
  } catch (err) {
    return response.status(500).json({
      error: { message: err.message || 'Erreur serveur.' }
    });
  }
}
