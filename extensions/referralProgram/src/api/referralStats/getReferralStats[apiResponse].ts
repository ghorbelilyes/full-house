/**
 * GET /referral/stats — returns referral statistics for the logged-in customer.
 */
import { pool } from '@evershop/evershop/lib/postgres';
import {
  isModuleEnabledSync,
  isModuleAvailableInContract
} from '../../../../moduleManager/dist/services/moduleRegistry.js';
import { getReferralStats, createReferralLink, getReferralSettings } from '../../services/referralService.js';

export default async function getReferralStatsHandler(request, response) {
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

  // Check authentication
  const customerId = request.locals?.customer?.customer_id;
  if (!customerId) {
    return response.status(401).json({
      error: { message: 'Veuillez vous connecter.' }
    });
  }

  try {
    const settings = await getReferralSettings();
    const stats = await getReferralStats(customerId);
    const storeUrl = request.protocol + '://' + request.get('host');
    const link = await createReferralLink(customerId, storeUrl);

    return response.json({
      data: {
        ...stats,
        referralLink: link,
        whatsappTemplate: settings.whatsappTemplate,
        cookieDurationDays: settings.cookieDurationDays
      }
    });
  } catch (err) {
    return response.status(500).json({
      error: { message: err.message || 'Erreur serveur.' }
    });
  }
}
