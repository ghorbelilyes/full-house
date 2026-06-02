import { pool } from '@evershop/evershop/lib/postgres';
import { isModuleEnabled } from './services/moduleRegistry.js';

export default function bootstrap() {
  // Preload DB overrides at startup so isModuleEnabledSync has data immediately.
  // This ensures the sync function reflects DB state from the first request.
  setTimeout(async () => {
    try {
      // Calling isModuleEnabled triggers loadDbOverrides which caches the result
      await isModuleEnabled('_preload_', pool);
    } catch {
      // Ignore — table might not exist yet
    }
  }, 1000);
}
