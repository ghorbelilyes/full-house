import { getSetting } from '@evershop/evershop/setting/services';
import {
  isModuleEnabledSync,
  isModuleAvailableInContract
} from '../../../../../moduleManager/dist/services/moduleRegistry.js';
import {
  getReferralStats,
  createReferralLink
} from '../../../services/referralService.js';

async function buildSettings() {
  return {
    enabled: (await getSetting('ref_enabled', '0')) === '1',
    title: await getSetting('ref_title', 'Programme de parrainage'),
    description: await getSetting('ref_description', 'Invitez vos amis et gagnez des récompenses'),
    referrerRewardType: await getSetting('ref_referrer_reward_type', 'percentage_discount'),
    referrerRewardValue: parseFloat(await getSetting('ref_referrer_reward_value', '10')),
    referredRewardType: await getSetting('ref_referred_reward_type', 'percentage_discount'),
    referredRewardValue: parseFloat(await getSetting('ref_referred_reward_value', '5')),
    minOrderAmount: parseFloat(await getSetting('ref_min_order_amount', '0')),
    rewardTrigger: await getSetting('ref_reward_trigger', 'first_completed_order'),
    couponExpiryDays: parseInt(await getSetting('ref_coupon_expiry_days', '30'), 10),
    maxReferrals: parseInt(await getSetting('ref_max_referrals', '50'), 10),
    allowGuestTracking: (await getSetting('ref_allow_guest_tracking', '1')) === '1',
    requireNewCustomer: (await getSetting('ref_require_new_customer', '1')) === '1',
    preventSelfReferral: (await getSetting('ref_prevent_self_referral', '1')) === '1',
    cookieDurationDays: parseInt(await getSetting('ref_cookie_duration_days', '30'), 10),
    whatsappTemplate: await getSetting(
      'ref_whatsapp_template',
      'Découvrez Protek ! Utilisez mon lien de parrainage pour une remise : {link}'
    ),
    termsText: await getSetting('ref_terms_text', ''),
    enableInAccount: (await getSetting('ref_enable_in_account', '1')) === '1',
    enableAfterCheckout: (await getSetting('ref_enable_after_checkout', '0')) === '1'
  };
}

export default {
  Query: {
    referralConfig: async () => {
      if (!isModuleAvailableInContract('referralProgram') || !isModuleEnabledSync('referralProgram')) {
        return null;
      }
      return { settings: await buildSettings() };
    },

    myReferralStats: async (_, __, context) => {
      if (!isModuleAvailableInContract('referralProgram') || !isModuleEnabledSync('referralProgram')) {
        return null;
      }

      const customerId = context.customer?.customer_id;
      if (!customerId) return null;

      const stats = await getReferralStats(customerId);
      const storeUrl = context.homeUrl || 'http://localhost:3000';
      const link = await createReferralLink(customerId, storeUrl);

      return {
        ...stats,
        referralLink: link
      };
    }
  }
};
