import { select } from '@evershop/postgres-query-builder';
import { getSetting } from '@evershop/evershop/setting/services';
import {
  isModuleEnabledSync,
  isModuleAvailableInContract
} from '../../../../../moduleManager/dist/services/moduleRegistry.js';

async function buildSettings() {
  return {
    enabled: (await getSetting('stw_enabled', '0')) === '1',
    popupTitle: await getSetting('stw_popup_title', 'Tentez votre chance'),
    popupSubtitle: await getSetting('stw_popup_subtitle', 'Tournez la roue et gagnez une remise'),
    buttonText: await getSetting('stw_button_text', 'Tourner la roue'),
    successMessage: await getSetting('stw_success_message', 'Félicitations !'),
    failureMessage: await getSetting('stw_failure_message', 'Essayez encore'),
    triggerType: await getSetting('stw_trigger_type', 'delay'),
    triggerDelay: parseInt(await getSetting('stw_trigger_delay', '5'), 10),
    showOnPages: JSON.parse(await getSetting('stw_show_on_pages', '["homepage","productView","categoryView"]')),
    inputRequired: await getSetting('stw_input_required', 'email'),
    allowGuest: (await getSetting('stw_allow_guest', '1')) === '1',
    requireLogin: (await getSetting('stw_require_login', '0')) === '1',
    maxSpinsVisitor: parseInt(await getSetting('stw_max_spins_visitor', '1'), 10),
    maxSpinsCustomer: parseInt(await getSetting('stw_max_spins_customer', '3'), 10),
    cooldown: await getSetting('stw_cooldown', 'once_forever'),
    mainColor: await getSetting('stw_main_color', '#e11d48'),
    bgColor: await getSetting('stw_bg_color', '#ffffff'),
    textColor: await getSetting('stw_text_color', '#1e293b'),
    buttonColor: await getSetting('stw_button_color', '#e11d48'),
    wheelColors: JSON.parse(await getSetting('stw_wheel_colors', '["#e11d48","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ec4899","#14b8a6"]')),
    soundEnabled: (await getSetting('stw_sound_enabled', '1')) === '1',
    confettiEnabled: (await getSetting('stw_confetti_enabled', '1')) === '1',
    termsText: await getSetting('stw_terms_text', '')
  };
}

export default {
  Query: {
    spinToWinConfig: async (_, __, { pool }) => {
      if (!isModuleAvailableInContract('spinToWin') || !isModuleEnabledSync('spinToWin')) {
        return null;
      }
      const settings = await buildSettings();
      const rewards = await select()
        .from('spin_to_win_reward')
        .orderBy('sort_order', 'ASC')
        .execute(pool);

      return {
        settings,
        rewards: rewards.map((r) => ({
          rewardId: r.reward_id,
          uuid: r.uuid,
          label: r.label,
          rewardType: r.reward_type,
          value: parseFloat(r.value),
          probability: parseFloat(r.probability),
          couponPrefix: r.coupon_prefix,
          couponExpiryDays: r.coupon_expiry_days,
          minOrderAmount: parseFloat(r.min_order_amount),
          maxUsage: r.max_usage,
          active: r.active,
          sortOrder: r.sort_order
        }))
      };
    },

    spinToWinFrontConfig: async () => {
      if (!isModuleAvailableInContract('spinToWin') || !isModuleEnabledSync('spinToWin')) {
        return null;
      }
      return await buildSettings();
    }
  }
};
