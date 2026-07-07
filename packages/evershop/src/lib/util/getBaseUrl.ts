import { isIP } from 'net';
import { normalizePort } from '../../bin/lib/normalizePort.js';
import isProductionMode from './isProductionMode.js';
import { getConfig } from './getConfig.js';

const CANONICAL_PRODUCTION_URL = 'https://www.fullhouse.com.tn';
const CANONICAL_PRODUCTION_HOST = 'www.fullhouse.com.tn';
const APEX_PRODUCTION_HOST = 'fullhouse.com.tn';
const INVALID_PRODUCTION_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function getLocalFallbackUrl(): string {
  return `http://localhost:${normalizePort()}`;
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch (e) {
    return null;
  }
}

function normalizeCandidate(
  value: string,
  options: {
    allowInternalHost: boolean;
    production: boolean;
  }
): string | null {
  const parsed = parseUrl(value);
  if (!parsed) {
    return null;
  }

  const protocol = parsed.protocol.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();
  const isCanonicalDomain =
    hostname === CANONICAL_PRODUCTION_HOST || hostname === APEX_PRODUCTION_HOST;
  const isInternalHost =
    INVALID_PRODUCTION_HOSTS.has(hostname) || isIP(hostname) !== 0;

  if (!['http:', 'https:'].includes(protocol)) {
    return null;
  }

  if (!options.allowInternalHost && (isInternalHost || parsed.port === '3000')) {
    return null;
  }

  if (options.production) {
    if (
      protocol !== 'https:' ||
      parsed.port ||
      hostname !== CANONICAL_PRODUCTION_HOST ||
      isInternalHost
    ) {
      return null;
    }
  }

  if (isCanonicalDomain) {
    parsed.protocol = 'https:';
    parsed.hostname = CANONICAL_PRODUCTION_HOST;
    parsed.port = '';
  }

  parsed.hash = '';
  parsed.pathname = '';
  parsed.search = '';

  return parsed.toString().replace(/\/+$/, '');
}

function resolveConfiguredBaseUrl(): string | null {
  const production = isProductionMode();
  const candidates = [
    {
      value: process.env.STORE_URL,
      allowInternalHost: true
    },
    {
      value: process.env.PUBLIC_STORE_URL,
      allowInternalHost: true
    },
    {
      value: getConfig('shop.homeUrl', ''),
      allowInternalHost: false
    }
  ];

  for (const candidate of candidates) {
    if (!candidate.value) {
      continue;
    }

    const normalized = normalizeCandidate(candidate.value, {
      allowInternalHost: candidate.allowInternalHost,
      production
    });

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function getBaseUrl(): string {
  const resolved = resolveConfiguredBaseUrl();
  if (resolved) {
    return resolved;
  }

  if (isProductionMode()) {
    // Do not trust request host in production because Nginx/PM2 can expose
    // an internal IP:port instead of the public canonical storefront domain.
    return CANONICAL_PRODUCTION_URL;
  }

  return getLocalFallbackUrl();
}

export function joinBaseUrl(baseUrl: string, path = '/'): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  return new URL(path || '/', `${normalizedBaseUrl}/`).toString();
}
