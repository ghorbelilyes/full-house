/**
 * Storefront + API route guard — blocks access to pages/APIs of disabled modules.
 * Runs on every storefront page request (pages/frontStore/all/).
 * Uses async isModuleEnabled to check DB overrides.
 */
import { isModuleEnabled } from '../../../services/moduleRegistry.js';
import {
  getModuleForStorefrontRoute,
  getModuleForApiRoute
} from '../../../services/routeModuleMap.js';
import { pool } from '@evershop/evershop/lib/postgres';

export default async function moduleGuard(request, response, next) {
  try {
    const path = request.path;

    // Check API routes
    const apiModule = getModuleForApiRoute(path);
    if (apiModule) {
      const enabled = await isModuleEnabled(apiModule, pool);
      if (!enabled) {
        return response.status(403).json({
          error: 'MODULE_DISABLED',
          message: 'Ce module est désactivé pour ce magasin.'
        });
      }
    }

    // Check storefront pages
    const pageModule = getModuleForStorefrontRoute(path);
    if (pageModule) {
      const enabled = await isModuleEnabled(pageModule, pool);
      if (!enabled) {
        return response.redirect('/');
      }
    }
  } catch (e) {
    // Don't block page load if module check fails
  }

  next();
}
