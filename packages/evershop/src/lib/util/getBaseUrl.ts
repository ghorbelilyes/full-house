import { normalizePort } from '../../bin/lib/normalizePort.js';
import { getConfig } from './getConfig.js';

export function getBaseUrl(): string {
  const port = normalizePort();
  // Allow STORE_URL env var to override config (useful for Docker/VPS deployments)
  const baseUrl =
    process.env.STORE_URL ||
    getConfig('shop.homeUrl', `http://localhost:${port}`);
  return baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
}
