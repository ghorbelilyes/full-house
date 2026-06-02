/**
 * Admin route guard — blocks access to pages of disabled modules.
 * Runs on every admin page request (pages/admin/all/).
 * Uses async isModuleEnabled to check DB overrides.
 */
import { isModuleEnabled } from '../../../services/moduleRegistry.js';
import { getModuleForAdminRoute } from '../../../services/routeModuleMap.js';
import { pool } from '@evershop/evershop/lib/postgres';

export default async function moduleGuard(request, response, next) {
  try {
    const moduleCode = getModuleForAdminRoute(request.path);
    if (moduleCode) {
      const enabled = await isModuleEnabled(moduleCode, pool);
      if (!enabled) {
        return response.redirect('/admin');
      }
    }
  } catch (e) {
    // Don't block page load if module check fails
  }
  next();
}
