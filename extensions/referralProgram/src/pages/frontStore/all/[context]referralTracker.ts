/**
 * Referral tracker middleware — detects ?ref=CODE in URL,
 * tracks the visit via API, and stores the code in a cookie.
 */
import {
  isModuleEnabledSync,
  isModuleAvailableInContract
} from '../../../../../moduleManager/dist/services/moduleRegistry.js';
import {
  trackReferralVisit,
  findReferrerByCode,
  hashValue
} from '../../../services/referralService.js';

export default async function referralTracker(request, response, next) {
  try {
    if (!isModuleAvailableInContract('referralProgram') || !isModuleEnabledSync('referralProgram')) {
      return next();
    }

    const refCode = request.query?.ref;
    if (!refCode || typeof refCode !== 'string') {
      return next();
    }

    // Verify code exists
    const codeRow = await findReferrerByCode(refCode);
    if (!codeRow) {
      return next();
    }

    // Prevent self-referral (if customer is logged in)
    const customerId = request.locals?.customer?.customer_id;
    if (customerId && codeRow.customer_id === customerId) {
      return next();
    }

    // Track visit
    const ip = request.headers['x-forwarded-for'] || request.socket?.remoteAddress || '';
    const ua = request.headers['user-agent'] || '';
    const ipHash = ip ? hashValue(ip) : null;
    const userAgentHash = ua ? hashValue(ua) : null;

    await trackReferralVisit(refCode, ipHash, userAgentHash, request.path || '/');

    // Set cookie with referral code (duration configured in settings, default 30 days)
    const cookieDays = 30; // Read from settings at runtime if needed
    response.cookie('ref_code', refCode, {
      maxAge: cookieDays * 24 * 60 * 60 * 1000,
      httpOnly: false,
      path: '/',
      sameSite: 'lax'
    });
  } catch (e) {
    // Don't block page load for tracking errors
  }

  next();
}
