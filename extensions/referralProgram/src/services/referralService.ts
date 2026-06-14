/**
 * Referral service — code generation, visit tracking, referral creation.
 */
import { createHash, randomBytes } from 'crypto';
import {
  select,
  insert,
  update,
  PoolClient
} from '@evershop/postgres-query-builder';
import { getBrandStoreNameFallback } from '@evershop/evershop/lib/branding/getBrandConfig.js';
import { pool } from '@evershop/evershop/lib/postgres';
import { getSetting } from '@evershop/evershop/setting/services';

/* ── Helpers ── */

export function hashValue(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

/* ── Settings ── */

export async function getReferralSettings() {
  return {
    enabled: await getSetting('ref_enabled', '0'),
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
    allowGuestTracking: await getSetting('ref_allow_guest_tracking', '1'),
    requireNewCustomer: await getSetting('ref_require_new_customer', '1'),
    preventSelfReferral: await getSetting('ref_prevent_self_referral', '1'),
    cookieDurationDays: parseInt(await getSetting('ref_cookie_duration_days', '30'), 10),
    whatsappTemplate: await getSetting(
      'ref_whatsapp_template',
      `Découvrez ${getBrandStoreNameFallback()} ! Utilisez mon lien de parrainage pour une remise : {link}`
    ),
    termsText: await getSetting('ref_terms_text', ''),
    enableInAccount: await getSetting('ref_enable_in_account', '1'),
    enableAfterCheckout: await getSetting('ref_enable_after_checkout', '0')
  };
}

/* ── Get or create referral code for a customer ── */

export async function getOrCreateReferralCode(customerId: number): Promise<string> {
  const existing = await select()
    .from('referral_code')
    .where('customer_id', '=', customerId)
    .load(pool);

  if (existing) return existing.code;

  let code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const dup = await select()
      .from('referral_code')
      .where('code', '=', code)
      .load(pool);
    if (!dup) break;
    code = generateCode();
    attempts++;
  }

  await insert('referral_code')
    .given({
      customer_id: customerId,
      code,
      active: true
    })
    .execute(pool, false);

  return code;
}

/* ── Track a referral visit ── */

export async function trackReferralVisit(
  referralCode: string,
  ipHash: string | null,
  userAgentHash: string | null,
  landingPage: string
): Promise<{ success: boolean; referralCodeId?: number }> {
  const codeRow = await select()
    .from('referral_code')
    .where('code', '=', referralCode)
    .andWhere('active', '=', true)
    .load(pool);

  if (!codeRow) return { success: false };

  await insert('referral_visit')
    .given({
      referral_code_id: codeRow.referral_code_id,
      ip_hash: ipHash,
      user_agent_hash: userAgentHash,
      landing_page: landingPage || '/'
    })
    .execute(pool, false);

  return { success: true, referralCodeId: codeRow.referral_code_id };
}

/* ── Create referral link ── */

export async function createReferralLink(
  customerId: number,
  storeUrl: string
): Promise<string> {
  const code = await getOrCreateReferralCode(customerId);
  const baseUrl = storeUrl.replace(/\/$/, '');
  return `${baseUrl}/?ref=${code}`;
}

/* ── Get referral stats for a customer ── */

export async function getReferralStats(customerId: number) {
  const code = await getOrCreateReferralCode(customerId);

  const codeRow = await select()
    .from('referral_code')
    .where('customer_id', '=', customerId)
    .load(pool);

  if (!codeRow) {
    return {
      code,
      invitedCount: 0,
      validatedCount: 0,
      availableRewards: 0,
      usedRewards: 0,
      pendingRewards: 0
    };
  }

  const visitsResult = await pool.query(
    `SELECT COUNT(DISTINCT ip_hash) as cnt FROM "referral_visit" WHERE "referral_code_id" = $1`,
    [codeRow.referral_code_id]
  );
  const invitedCount = parseInt(visitsResult.rows[0]?.cnt || '0', 10);

  const referrals = await pool.query(
    `SELECT "status", COUNT(*) as cnt FROM "referral"
     WHERE "referrer_customer_id" = $1
     GROUP BY "status"`,
    [customerId]
  );
  const statusCounts: Record<string, number> = {};
  for (const row of referrals.rows) {
    statusCounts[row.status] = parseInt(row.cnt, 10);
  }

  const rewards = await pool.query(
    `SELECT "status", COUNT(*) as cnt FROM "referral_reward"
     WHERE "customer_id" = $1
     GROUP BY "status"`,
    [customerId]
  );
  const rewardCounts: Record<string, number> = {};
  for (const row of rewards.rows) {
    rewardCounts[row.status] = parseInt(row.cnt, 10);
  }

  return {
    code,
    invitedCount,
    validatedCount: (statusCounts.validated || 0) + (statusCounts.rewarded || 0),
    availableRewards: rewardCounts.available || 0,
    usedRewards: rewardCounts.used || 0,
    pendingRewards: rewardCounts.pending || 0
  };
}

/* ── Find referrer by code ── */

export async function findReferrerByCode(code: string) {
  const row = await select()
    .from('referral_code')
    .where('code', '=', code)
    .andWhere('active', '=', true)
    .load(pool);
  return row;
}

/* ── Create a referral record ── */

export async function createReferral(
  referrerCustomerId: number,
  referredCustomerId: number | null,
  referredEmail: string | null,
  orderId: number | null,
  connection?: PoolClient
): Promise<boolean> {
  const conn = connection || pool;
  const settings = await getReferralSettings();

  // Prevent self-referral
  if (settings.preventSelfReferral === '1' && referrerCustomerId === referredCustomerId) {
    return false;
  }

  // Check duplicate
  if (referredCustomerId) {
    const existing = await select()
      .from('referral')
      .where('referrer_customer_id', '=', referrerCustomerId)
      .andWhere('referred_customer_id', '=', referredCustomerId)
      .load(pool);
    if (existing) return false;
  }

  // Check max referrals
  const countResult = await pool.query(
    `SELECT COUNT(*) as cnt FROM "referral" WHERE "referrer_customer_id" = $1`,
    [referrerCustomerId]
  );
  const count = parseInt(countResult.rows[0]?.cnt || '0', 10);
  if (count >= settings.maxReferrals) return false;

  await insert('referral')
    .given({
      referrer_customer_id: referrerCustomerId,
      referred_customer_id: referredCustomerId,
      referred_email: referredEmail,
      order_id: orderId,
      status: 'pending'
    })
    .execute(conn, false);

  return true;
}
