/**
 * Referral reward service — generates coupons when referrals are validated.
 */
import { createHash, randomBytes } from 'crypto';
import {
  select,
  insert,
  update,
  execute,
  PoolClient
} from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';
import { getReferralSettings } from './referralService.js';

function generateCouponCode(prefix: string): string {
  const rand = randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${rand}`;
}

/**
 * Validate a referral and generate rewards for referrer (and optionally referred).
 */
export async function validateReferral(
  referralId: number,
  connection: PoolClient
): Promise<boolean> {
  const settings = await getReferralSettings();

  // Load the referral
  const referral = await select()
    .from('referral')
    .where('referral_id', '=', referralId)
    .load(pool);

  if (!referral || referral.status !== 'pending') return false;

  // Update referral status
  await update('referral')
    .given({ status: 'validated', validated_at: new Date().toISOString() })
    .where('referral_id', '=', referralId)
    .execute(connection, false);

  const expiryDays = settings.couponExpiryDays || 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  // ── Reward for referrer ──
  if (settings.referrerRewardType && settings.referrerRewardType !== 'none') {
    const couponCode = await createRewardCoupon(
      settings.referrerRewardType,
      settings.referrerRewardValue,
      expiryDays,
      'REFR',
      settings.minOrderAmount,
      connection
    );

    await insert('referral_reward')
      .given({
        referral_id: referralId,
        customer_id: referral.referrer_customer_id,
        reward_type: settings.referrerRewardType,
        reward_value: settings.referrerRewardValue,
        coupon_code: couponCode,
        status: 'available',
        expires_at: expiresAt.toISOString()
      })
      .execute(connection, false);
  }

  // ── Reward for referred friend ──
  if (
    referral.referred_customer_id &&
    settings.referredRewardType &&
    settings.referredRewardType !== 'none'
  ) {
    const couponCode = await createRewardCoupon(
      settings.referredRewardType,
      settings.referredRewardValue,
      expiryDays,
      'REFD',
      settings.minOrderAmount,
      connection
    );

    await insert('referral_reward')
      .given({
        referral_id: referralId,
        customer_id: referral.referred_customer_id,
        reward_type: settings.referredRewardType,
        reward_value: settings.referredRewardValue,
        coupon_code: couponCode,
        status: 'available',
        expires_at: expiresAt.toISOString()
      })
      .execute(connection, false);
  }

  // Update referral to rewarded
  await update('referral')
    .given({ status: 'rewarded' })
    .where('referral_id', '=', referralId)
    .execute(connection, false);

  return true;
}

/**
 * Create a coupon in the existing coupon table for a referral reward.
 */
async function createRewardCoupon(
  rewardType: string,
  rewardValue: number,
  expiryDays: number,
  prefix: string,
  minOrderAmount: number,
  connection: PoolClient
): Promise<string> {
  const code = generateCouponCode(prefix);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + expiryDays);

  let discountType = 'percentage_discount_to_entire_order';
  let discountAmount = rewardValue || 0;
  let freeShipping = false;

  if (rewardType === 'fixed_discount') {
    discountType = 'fixed_discount_to_entire_order';
  } else if (rewardType === 'free_shipping') {
    discountType = 'fixed_discount_to_entire_order';
    discountAmount = 0;
    freeShipping = true;
  }

  const condition = minOrderAmount > 0
    ? JSON.stringify({ order_total: minOrderAmount })
    : null;

  await insert('coupon')
    .given({
      status: true,
      description: `Parrainage : récompense ${rewardType}`,
      discount_amount: discountAmount,
      free_shipping: freeShipping,
      discount_type: discountType,
      coupon: code,
      max_uses_time_per_coupon: 1,
      max_uses_time_per_customer: 1,
      end_date: endDate.toISOString(),
      condition
    })
    .execute(connection, false);

  return code;
}

/**
 * Check pending referrals for a given order and validate them
 * if the order matches the configured trigger status.
 */
export async function checkAndValidateReferrals(
  orderId: number,
  orderStatus: string,
  paymentStatus: string,
  shipmentStatus: string,
  connection: PoolClient
): Promise<void> {
  const settings = await getReferralSettings();
  if (settings.enabled !== '1') return;

  const trigger = settings.rewardTrigger;
  let shouldValidate = false;

  switch (trigger) {
    case 'first_completed_order':
      shouldValidate = orderStatus === 'completed';
      break;
    case 'first_paid_order':
      shouldValidate = paymentStatus === 'paid';
      break;
    case 'first_delivered_order':
      shouldValidate = shipmentStatus === 'delivered';
      break;
    case 'account_creation':
      // This is handled separately at registration time
      shouldValidate = false;
      break;
    default:
      shouldValidate = orderStatus === 'completed';
  }

  if (!shouldValidate) return;

  // Find pending referrals linked to this order
  const pendingReferrals = await select()
    .from('referral')
    .where('order_id', '=', orderId)
    .andWhere('status', '=', 'pending')
    .execute(pool);

  for (const ref of pendingReferrals) {
    await validateReferral(ref.referral_id, connection);
  }
}
