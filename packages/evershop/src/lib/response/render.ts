import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import jsesc from 'jsesc';
import { getNotifications } from '../../modules/base/services/notifications.js';
import { getPageMetaInfo } from '../../modules/cms/services/pageMetaInfo.js';
import { Config } from '../../types/appContext.js';
import { EvershopRequest } from '../../types/request.js';
import { EvershopResponse } from '../../types/response.js';
import { error } from '../log/logger.js';
import { get } from '../util/get.js';
import { getConfig } from '../util/getConfig.js';
import isProductionMode from '../util/isProductionMode.js';
import { processPreloadImages } from '../util/preloadScan.js';
import { getValueSync } from '../util/registry.js';
import { getRouteBuildPath } from '../webpack/getRouteBuildPath.js';

function normalizeAssets(assets) {
  if (typeof assets === 'object' && !Array.isArray(assets) && assets !== null) {
    return Object.values(assets);
  }

  return Array.isArray(assets) ? assets : [assets];
}

function buildContextData(
  request: EvershopRequest,
  response: EvershopResponse
) {
  const pageMeta = getPageMetaInfo(request);
  const appConfig = getValueSync<Config>(
    'appConfig',
    {
      tax: {
        priceIncludingTax: getConfig('pricing.tax.price_including_tax', false)
      },
      catalog: {
        imageDimensions: {
          width: getConfig('catalog.product.image.width', 1200),
          height: getConfig('catalog.product.image.height', 1200)
        }
      },
      pageMeta: pageMeta
    },
    { request, response },
    (value) => value && typeof value === 'object' && !Array.isArray(value)
  );
  const config = Object.assign({}, appConfig, { pageMeta });
  const contextValue = {
    graphqlResponse: get(response, 'locals.graphqlResponse', {}),
    config: config,
    propsMap: get(response, 'locals.propsMap', {}),
    widgets: get(response, 'locals.widgets', []),
    notifications: getNotifications(request)
  };
  return contextValue;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDevelopmentHead(pageMeta) {
  const title = escapeHtml(pageMeta.title || '');
  const description = escapeHtml(pageMeta.description || '');
  const canonicalUrl = pageMeta.canonicalUrl || pageMeta.route?.url || '';
  const ogUrl = pageMeta.ogInfo?.url || canonicalUrl;
  const ogImage = pageMeta.ogInfo?.image || '';
  const ogType = pageMeta.ogInfo?.type || 'website';
  const siteName = pageMeta.ogInfo?.siteName || pageMeta.title || '';
  const twitterCard = pageMeta.ogInfo?.twitterCard || 'summary';
  const twitterSite = pageMeta.ogInfo?.twitterSite || siteName;
  const twitterCreator = pageMeta.ogInfo?.twitterCreator || siteName;
  const twitterImage = pageMeta.ogInfo?.twitterImage || ogImage;
  const structuredData = [];

  if (pageMeta.baseUrl) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url: pageMeta.baseUrl
    });
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: pageMeta.baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${pageMeta.baseUrl}/search?keyword={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });
  }

  if (
    pageMeta.baseUrl &&
    pageMeta.route?.path &&
    pageMeta.route.path !== '/' &&
    pageMeta.title
  ) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${pageMeta.baseUrl}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: pageMeta.title,
          item: pageMeta.route.url || `${pageMeta.baseUrl}${pageMeta.route.path}`
        }
      ]
    });
  }

  return [
    title ? `<title>${title}</title>` : '',
    description
      ? `<meta name="description" content="${description}" />`
      : '',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    canonicalUrl
      ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`
      : '',
    `<meta property="og:type" content="${escapeHtml(ogType)}" />`,
    title ? `<meta property="og:title" content="${title}" />` : '',
    description
      ? `<meta property="og:description" content="${description}" />`
      : '',
    ogImage
      ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />`
      : '',
    ogUrl ? `<meta property="og:url" content="${escapeHtml(ogUrl)}" />` : '',
    siteName
      ? `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`
      : '',
    pageMeta.ogInfo?.locale
      ? `<meta property="og:locale" content="${escapeHtml(pageMeta.ogInfo.locale)}" />`
      : '',
    `<meta name="twitter:card" content="${escapeHtml(twitterCard)}" />`,
    title ? `<meta name="twitter:title" content="${title}" />` : '',
    description
      ? `<meta name="twitter:description" content="${description}" />`
      : '',
    twitterSite
      ? `<meta name="twitter:site" content="${escapeHtml(twitterSite)}" />`
      : '',
    twitterCreator
      ? `<meta name="twitter:creator" content="${escapeHtml(twitterCreator)}" />`
      : '',
    twitterImage
      ? `<meta name="twitter:image" content="${escapeHtml(twitterImage)}" />`
      : '',
    structuredData.length > 0
      ? `<script type="application/ld+json">${escapeHtml(
          JSON.stringify(structuredData)
        )}</script>`
      : ''
  ]
    .filter(Boolean)
    .join('\n                  ');
}

function renderDevelopment(
  request: EvershopRequest,
  response: EvershopResponse
) {
  const route = request.currentRoute;
  const configLanguage = getConfig('shop.language', 'en');
  const cookieLanguage = request.cookies?.evershop_language;
  const language = cookieLanguage && ['en', 'fr'].includes(cookieLanguage) ? cookieLanguage : configLanguage;
  if (!route) {
    // In testing mode, we do not have devMiddleware
    response.send(`
            <html>
              <head>
                <title>Sample Html Response</title>
                <script>Sample Html Response</script>
              </head>
              <body>
              </body>
            </html>
            `);
    return;
  }
  const contextValue = buildContextData(request, response);
  const safeContextValue = jsesc(contextValue, {
    json: true,
    isScriptContext: true
  });
  const devHeadMarkup = buildDevelopmentHead(contextValue.config.pageMeta);
  const langCode = request.currentRoute?.isAdmin ? 'en' : language;
  const translations = get(request, 'locals.context.translations', {});
  const translationsScript = Object.keys(translations).length > 0
    ? `window.__translations__=${jsesc(translations, { json: true, isScriptContext: true })};`
    : '';
  const scriptPath = route.isAdmin ? '/backend/admin-main.js' : '/main.js';
  response.send(`
            <!doctype html><html lang="${langCode}">
                <head>
                  ${devHeadMarkup}
                  <script>var eContext = ${safeContextValue};${translationsScript}</script>
                  <script>
                    (function() {
                      try {
                        var stored = localStorage.getItem('evershop_theme');
                        var theme = stored || 'system';
                        var resolved = theme;
                        if (theme === 'system') {
                          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                        }
                        document.documentElement.setAttribute('data-theme', resolved);
                      } catch(e) {}
                    })();
                  </script>
                </head>
                <body class="${route.isAdmin ? `admin ${route.id}` : `frontStore ${route.id}`}">
                <div id="app"></div>
                 <script defer src="${scriptPath}"></script>
                </body >
            </html >
  `);
}

function renderProduction(request, response) {
  const configLanguage = getConfig('shop.language', 'en');
  const cookieLanguage = request.cookies?.evershop_language;
  const language = cookieLanguage && ['en', 'fr'].includes(cookieLanguage) ? cookieLanguage : configLanguage;
  const route = request.currentRoute;
  const langCode = route.isAdmin === true ? 'en' : language;
  const serverIndexPath = path.resolve(
    getRouteBuildPath(route),
    'server',
    'index.js'
  );
  const assetsPath = path.resolve(
    getRouteBuildPath(route),
    'client',
    'index.json'
  );
  const assets = JSON.parse(fs.readFileSync(assetsPath, 'utf8'));
  const cssList = [] as string[];
  for (let i = 0; i < assets.css.length; i++) {
    const cssFilePath = path.resolve(
      getRouteBuildPath(route),
      'client',
      path.basename(assets.css[i])
    );
    if (fs.existsSync(cssFilePath)) {
      const cssContent = fs.readFileSync(cssFilePath, 'utf8');
      // Inline the css content to reduce the number of requests
      cssList.push(cssContent);
    }
  }
  const contextValue = buildContextData(request, response);
  const translations = get(request, 'locals.context.translations', {});
  const safeContextValue = jsesc(contextValue, {
    json: true,
    isScriptContext: true
  });
  const translationsScript = Object.keys(translations).length > 0
    ? `window.__translations__=${jsesc(translations, { json: true, isScriptContext: true })};`
    : '';
  import(pathToFileURL(serverIndexPath).toString())
    .then((module) => {
      const source = processPreloadImages(
        module.default(
          request.currentRoute,
          assets.js,
          cssList,
          safeContextValue,
          langCode,
          translationsScript
        )
      );
      response.send(source);
    })
    .catch((e) => {
      error(e);
    });
}

export function render(request, response) {
  if (isProductionMode()) {
    renderProduction(request, response);
  } else {
    renderDevelopment(request, response);
  }
}
