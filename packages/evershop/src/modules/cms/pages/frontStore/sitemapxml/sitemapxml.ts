import { execute } from '@evershop/postgres-query-builder';
import { error } from '../../../../../lib/log/logger.js';
import { pool } from '../../../../../lib/postgres/connection.js';
import {
  getBaseUrl,
  joinBaseUrl
} from '../../../../../lib/util/getBaseUrl.js';

const BLOCKED_EXACT_PATHS = new Set([
  '/admin',
  '/api',
  '/cart',
  '/checkout',
  '/account',
  '/login',
  '/register',
  '/search',
  '/videosurveillance/aa',
  '/videosurveillance/fff',
  '/alarme/ajax/test'
]);

const BLOCKED_PREFIXES = ['/admin/', '/api/'];

const BLOCKED_SEGMENTS = new Set([
  'test',
  'tests',
  'demo',
  'demos',
  'sample',
  'samples'
]);

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAbsoluteUrl(baseUrl: string, path: string): string {
  return joinBaseUrl(baseUrl, path);
}

function toLastMod(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function isIndexablePath(path: string): boolean {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (BLOCKED_EXACT_PATHS.has(normalizedPath)) {
    return false;
  }

  if (BLOCKED_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) {
    return false;
  }

  if (normalizedPath.includes('?')) {
    return false;
  }

  const segments = normalizedPath
    .split('/')
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);

  if (segments.some((segment) => BLOCKED_SEGMENTS.has(segment))) {
    return false;
  }

  return true;
}

function renderUrlTag({
  loc,
  lastmod,
  changefreq,
  priority
}: {
  loc: string;
  lastmod?: string | null;
  changefreq?: string;
  priority?: string;
}): string {
  const parts = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`];

  if (lastmod) {
    parts.push(`    <lastmod>${lastmod}</lastmod>`);
  }
  if (changefreq) {
    parts.push(`    <changefreq>${changefreq}</changefreq>`);
  }
  if (priority) {
    parts.push(`    <priority>${priority}</priority>`);
  }

  parts.push('  </url>');
  return parts.join('\n');
}

async function loadSitemapEntries(baseUrl: string) {
  const [categoryResult, productResult, cmsResult] = await Promise.all([
    execute(
      pool,
      `
        SELECT ur.request_path, c.updated_at
        FROM url_rewrite ur
        INNER JOIN category c ON c.uuid = ur.entity_uuid
        WHERE ur.entity_type = 'category'
          AND c.status = TRUE
        ORDER BY ur.request_path ASC
      `
    ),
    execute(
      pool,
      `
        SELECT ur.request_path, p.updated_at
        FROM url_rewrite ur
        INNER JOIN product p ON p.uuid = ur.entity_uuid
        WHERE ur.entity_type = 'product'
          AND p.status = TRUE
          AND p.visibility = TRUE
        ORDER BY ur.request_path ASC
      `
    ),
    execute(
      pool,
      `
        SELECT cpd.url_key, cp.updated_at
        FROM cms_page cp
        INNER JOIN cms_page_description cpd
          ON cpd.cms_page_description_cms_page_id = cp.cms_page_id
        WHERE cp.status = TRUE
        ORDER BY cpd.url_key ASC
      `
    )
  ]);

  const entries = [
    {
      loc: toAbsoluteUrl(baseUrl, '/'),
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      loc: toAbsoluteUrl(baseUrl, '/boutique'),
      changefreq: 'daily',
      priority: '0.9'
    },
    ...categoryResult.rows.map((row) => ({
      loc: toAbsoluteUrl(baseUrl, row.request_path),
      lastmod: toLastMod(row.updated_at),
      changefreq: 'weekly',
      priority: '0.8'
    })).filter((entry) => isIndexablePath(new URL(entry.loc).pathname)),
    ...productResult.rows.map((row) => ({
      loc: toAbsoluteUrl(baseUrl, row.request_path),
      lastmod: toLastMod(row.updated_at),
      changefreq: 'weekly',
      priority: '0.7'
    })).filter((entry) => isIndexablePath(new URL(entry.loc).pathname)),
    ...cmsResult.rows.map((row) => ({
      loc: toAbsoluteUrl(baseUrl, `/page/${row.url_key}`),
      lastmod: toLastMod(row.updated_at),
      changefreq: 'monthly',
      priority: '0.6'
    })).filter((entry) => isIndexablePath(new URL(entry.loc).pathname))
  ];

  const deduped = new Map();
  entries.forEach((entry) => {
    if (!deduped.has(entry.loc)) {
      deduped.set(entry.loc, entry);
    }
  });

  return Array.from(deduped.values());
}

function buildFallbackEntries(baseUrl: string) {
  return [
    {
      loc: toAbsoluteUrl(baseUrl, '/'),
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      loc: toAbsoluteUrl(baseUrl, '/boutique'),
      changefreq: 'daily',
      priority: '0.9'
    }
  ];
}

export default async function sitemapXml(request, response) {
  const baseUrl = getBaseUrl();

  try {
    const entries = await loadSitemapEntries(baseUrl);
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries.map((entry) => renderUrlTag(entry)),
      '</urlset>'
    ].join('\n');

    response.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    response.setHeader('Cache-Control', 'public, max-age=3600');
    response.status(200).send(xml);
  } catch (e) {
    error(e);

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...buildFallbackEntries(baseUrl).map((entry) => renderUrlTag(entry)),
      '</urlset>'
    ].join('\n');

    response.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    response.setHeader('Cache-Control', 'public, max-age=300');
    response.status(200).send(xml);
  }
}
