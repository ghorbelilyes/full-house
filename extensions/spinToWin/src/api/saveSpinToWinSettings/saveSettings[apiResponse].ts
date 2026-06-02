/**
 * POST /admin/spin-to-win/settings — save spin-to-win configuration.
 * Saves settings to the generic setting table + rewards to spin_to_win_reward.
 */
import {
  insertOnUpdate,
  commit,
  rollback,
  execute,
  insert
} from '@evershop/postgres-query-builder';
import { getConnection } from '@evershop/evershop/lib/postgres';
import { refreshSetting } from '@evershop/evershop/setting/services';
import {
  isModuleEnabledSync,
  isModuleAvailableInContract
} from '../../../../moduleManager/dist/services/moduleRegistry.js';

const SETTING_KEYS = [
  'stw_enabled', 'stw_popup_title', 'stw_popup_subtitle', 'stw_button_text',
  'stw_success_message', 'stw_failure_message', 'stw_trigger_type',
  'stw_trigger_delay', 'stw_show_on_pages', 'stw_input_required',
  'stw_allow_guest', 'stw_require_login', 'stw_max_spins_visitor',
  'stw_max_spins_customer', 'stw_cooldown', 'stw_main_color', 'stw_bg_color',
  'stw_text_color', 'stw_button_color', 'stw_wheel_colors',
  'stw_sound_enabled', 'stw_confetti_enabled', 'stw_terms_text'
];

export default async function saveSettings(request, response) {
  // ── Module guard ──
  if (!isModuleAvailableInContract('spinToWin')) {
    return response.status(403).json({
      error: {
        code: 'MODULE_NOT_INCLUDED',
        message: 'Ce module n\'est pas inclus dans votre contrat.'
      }
    });
  }
  if (!isModuleEnabledSync('spinToWin')) {
    return response.status(403).json({
      error: {
        code: 'MODULE_DISABLED',
        message: 'Ce module est désactivé pour ce magasin.'
      }
    });
  }

  const { settings, rewards } = request.body;
  const connection = await getConnection();

  try {
    // ── Save settings ──
    if (settings && typeof settings === 'object') {
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
    }

    // ── Save rewards ──
    if (Array.isArray(rewards)) {
      // Validate total probability
      const totalProb = rewards
        .filter((r) => r.active !== false)
        .reduce((sum, r) => sum + (parseFloat(r.probability) || 0), 0);

      if (totalProb < 99.9 || totalProb > 100.1) {
        await rollback(connection);
        return response.status(400).json({
          error: {
            message: `La somme des probabilités doit être 100%. Actuel : ${totalProb.toFixed(1)}%`
          }
        });
      }

      // Delete existing rewards and re-insert
      await execute(connection, 'DELETE FROM "spin_to_win_spin" WHERE 1=1');
      await execute(connection, 'DELETE FROM "spin_to_win_reward" WHERE 1=1');

      for (let i = 0; i < rewards.length; i++) {
        const r = rewards[i];
        await insert('spin_to_win_reward')
          .given({
            label: r.label || 'Segment',
            reward_type: r.reward_type || 'no_win',
            value: parseFloat(r.value) || 0,
            probability: parseFloat(r.probability) || 0,
            coupon_prefix: r.coupon_prefix || null,
            coupon_expiry_days: parseInt(r.coupon_expiry_days, 10) || 30,
            min_order_amount: parseFloat(r.min_order_amount) || 0,
            max_usage: parseInt(r.max_usage, 10) || 1,
            active: r.active !== false,
            sort_order: i + 1
          })
          .execute(connection, false);
      }
    }

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
