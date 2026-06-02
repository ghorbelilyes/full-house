/**
 * After an order is placed, check for a referral cookie (ref_code)
 * and create the referral record linking the referrer to this order.
 */
import { select } from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';
import {
  isModuleEnabledSync,
  isModuleAvailableInContract
} from '../../../../../moduleManager/dist/services/moduleRegistry.js';
import {
  findReferrerByCode,
  createReferral
} from '../../../services/referralService.js';

export default async function linkReferralToOrder(request, response, next) {
  try {
    if (
      !isModuleAvailableInContract('referralProgram') ||
      !isModuleEnabledSync('referralProgram')
    ) {
      return next();
    }

    // Read referral code from cookie
    const refCode = request.cookies?.ref_code;
    if (!refCode) return next();

    // Get order from response body (set by placeOrder middleware)
    const orderData = response.$body?.data;
    if (!orderData?.order_id) return next();

    // Validate referral code
    const codeRow = await findReferrerByCode(refCode);
    if (!codeRow) return next();

    // Prevent self-referral
    if (orderData.customer_id && codeRow.customer_id === orderData.customer_id) {
      return next();
    }

    // Create the referral record
    await createReferral(
      codeRow.customer_id,           // referrer
      orderData.customer_id || null,  // referred customer
      orderData.email || null,        // referred email
      orderData.order_id              // order ID
    );

    // Clear the referral cookie after linking
    response.clearCookie('ref_code', { path: '/' });
  } catch (e) {
    // Don't block order completion for referral errors
  }

  next();
}
