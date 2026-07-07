import {
  getBaseUrl,
  joinBaseUrl
} from '../../../../../lib/util/getBaseUrl.js';

export default async function robotsTxt(request, response) {
  const baseUrl = getBaseUrl();

  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /account',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /search',
    '',
    `Sitemap: ${joinBaseUrl(baseUrl, '/sitemap.xml')}`
  ];

  response.setHeader('Content-Type', 'text/plain; charset=UTF-8');
  response.setHeader('Cache-Control', 'public, max-age=3600');
  response.status(200).send(lines.join('\n'));
}
