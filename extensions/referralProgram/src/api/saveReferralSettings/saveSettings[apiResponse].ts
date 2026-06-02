/**
 * POST /admin/referral/settings — save referral program configuration.
 */
import { insertOnUpdate, commit, rollback } from '@evershop/postgres-query-builder';
import { getConnection } from '@evershop/evershop/lib/postgres';
import { refreshSetting } from '@evershop/evershop/setting/services';
import {
  isModuleEnabledSync,
  isModuleAvailableInContract
} from '../../../../moduleManager/dist/services/moduleRegistry.js';

const SETTING_KEYS = [
  'ref_enabled', 'ref_title', 'ref_description',
  'ref_referrer_reward_type', 'ref_referrer_reward_value',
  'ref_referred_reward_type', 'ref_referred_reward_value',
  'ref_min_order_amount', 'ref_reward_trigger', 'ref_coupon_expiry_days',
  'ref_max_referrals', 'ref_allow_guest_tracking', 'ref_require_new_customer',
  'ref_prevent_self_referral', 'ref_cookie_duration_days',
  'ref_whatsapp_template', 'ref_terms_text',
  'ref_enable_in_account', 'ref_enable_after_checkout'
];

export default async function saveSettings(request, response) {
  // Module guard
  if (!isModuleAvailableInContract('referralProgram')) {
    return response.status(403).json({
      error: {
        code: 'MODULE_NOT_INCLUDED',
        message: 'Ce module n\'est pas inclus dans votre contrat.'
      }
    });
  }
  if (!isModuleEnabledSync('referralProgram')) {
    return response.status(403).json({
      error: {
        code: 'MODULE_DISABLED',
        message: 'Ce module est désactivé pour ce magasin.'
      }
    });
  }

  const { settings } = request.body;
  if (!settings || typeof settings !== 'object') {
    return response.status(400).json({
      error: { message: 'Données invalides.' }
    });
  }

  const connection = await getConnection();
  try {
    const promises = [];
    for (const key of SETTING_KEYS) {
      if (settings[key] !== undefined) {
        let value = settings[key];
        let isJson = false;
        if (typeof value === 'object') {
          value = JSON.stringify(value);
          isJson = true;
        }
        promises.push(
          insertOnUpdate('setting', ['name'])
            .given({ name: key, value: String(value), is_json: isJson })
            .execute(connection, false)
        );
      }
    }
    await Promise.all(promises);
    await commit(connection);
    await refreshSetting();

    return response.json({
      success: true,
      data: { message: 'Configuration sauvegardée avec succès.' }
    });
  } catch (err) {
    await rollback(connection);
    return response.status(500).json({
      error: { message: err.message || 'Erreur lors de la sauvegarde.' }
    });
  }
}
