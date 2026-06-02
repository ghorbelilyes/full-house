/**
 * referralProgram bootstrap — hooks into order status changes
 * to validate referrals and generate rewards.
 */
import { hookAfter } from '@evershop/evershop/lib/util/hookable';
import { pool } from '@evershop/evershop/lib/postgres';
import { select } from '@evershop/postgres-query-builder';
import { error } from '@evershop/evershop/lib/log';
import { isModuleEnabledSync } from '../../moduleManager/dist/services/moduleRegistry.js';
import { checkAndValidateReferrals } from './services/referralRewardService.js';

export default () => {
  // Hook after payment status changes to check referral validation
  hookAfter(
    'changePaymentStatus',
    async function referralAfterPaymentChange(_result, orderId, status, connection) {
      try {
        if (!isModuleEnabledSync('referralProgram')) return;

        const order = await select()
          .from('order')
          .where('order_id', '=', orderId)
          .load(pool);

        if (!order) return;

        await checkAndValidateReferrals(
          orderId,
          order.status,
          status,
          order.shipment_status,
          connection
        );
      } catch (e) {
        error(e);
      }
    },
    30
  );

  // Hook after shipment status changes
  hookAfter(
    'changeShipmentStatus',
    async function referralAfterShipmentChange(_result, orderId, status, connection) {
      try {
        if (!isModuleEnabledSync('referralProgram')) return;

        const order = await select()
          .from('order')
          .where('order_id', '=', orderId)
          .load(pool);

        if (!order) return;

        await checkAndValidateReferrals(
          orderId,
          order.status,
          order.payment_status,
          status,
          connection
        );
      } catch (e) {
        error(e);
      }
    },
    30
  );
};
