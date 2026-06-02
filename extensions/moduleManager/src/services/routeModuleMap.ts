/**
 * Maps URL path prefixes to module codes.
 * Used by the feature guard middleware to block disabled modules' routes.
 */

interface RouteMapping {
  pattern: RegExp;
  moduleCode: string;
}

const ADMIN_ROUTE_MAP: RouteMapping[] = [
  // Coupons (core promotion module)
  { pattern: /^\/admin\/coupons/i, moduleCode: 'coupons' },
  { pattern: /^\/admin\/coupon\//i, moduleCode: 'coupons' },
  // WhatsApp settings
  { pattern: /^\/admin\/whatsapp/i, moduleCode: 'whatsappNotifications' },
  // AI description settings
  { pattern: /^\/admin\/setting\/ai-description/i, moduleCode: 'aiProductDescriptions' },
  // Spin to Win settings
  { pattern: /^\/admin\/setting\/spin-to-win/i, moduleCode: 'spinToWin' },
  // Referral settings
  { pattern: /^\/admin\/setting\/referral/i, moduleCode: 'referralProgram' },
];

const STOREFRONT_ROUTE_MAP: RouteMapping[] = [
  // Wishlist page
  { pattern: /^\/wishlist/i, moduleCode: 'wishlist' },
];

const API_ROUTE_MAP: RouteMapping[] = [
  // Coupons
  { pattern: /^\/api\/carts\/.*\/coupon/i, moduleCode: 'coupons' },
  { pattern: /^\/api\/coupons/i, moduleCode: 'coupons' },
  // Reviews
  { pattern: /^\/api\/products\/.*\/review/i, moduleCode: 'productReviews' },
  // Wishlist
  { pattern: /^\/api\/wishlist/i, moduleCode: 'wishlist' },
  // AI description
  { pattern: /^\/api\/ai\//i, moduleCode: 'aiProductDescriptions' },
  { pattern: /^\/api\/ai-description/i, moduleCode: 'aiProductDescriptions' },
  // Spin to Win
  { pattern: /^\/spin-wheel/i, moduleCode: 'spinToWin' },
  { pattern: /^\/admin\/spin-to-win/i, moduleCode: 'spinToWin' },
  // Referral
  { pattern: /^\/referral\//i, moduleCode: 'referralProgram' },
  { pattern: /^\/admin\/referral/i, moduleCode: 'referralProgram' },
  // WhatsApp — settings are saved via the core saveSetting route, no separate API to block
];

export function getModuleForAdminRoute(path: string): string | null {
  for (const mapping of ADMIN_ROUTE_MAP) {
    if (mapping.pattern.test(path)) return mapping.moduleCode;
  }
  return null;
}

export function getModuleForStorefrontRoute(path: string): string | null {
  for (const mapping of STOREFRONT_ROUTE_MAP) {
    if (mapping.pattern.test(path)) return mapping.moduleCode;
  }
  return null;
}

export function getModuleForApiRoute(path: string): string | null {
  for (const mapping of API_ROUTE_MAP) {
    if (mapping.pattern.test(path)) return mapping.moduleCode;
  }
  return null;
}
