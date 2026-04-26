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

function renderDevelopment(
  request: EvershopRequest,
  response: EvershopResponse
) {
  const route = request.currentRoute;
  const classes = route.isAdmin
    ? `admin ${route.id}`
    : `frontStore ${route.id}`;
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
  const langCode = request.currentRoute?.isAdmin ? 'en' : language;
  const translations = get(request, 'locals.context.translations', {});
  const translationsScript = Object.keys(translations).length > 0
    ? `window.__translations__=${jsesc(translations, { json: true, isScriptContext: true })};`
    : '';
  const scriptPath = route.isAdmin ? '/backend/admin-main.js' : '/main.js';
  response.send(`
            <!doctype html><html lang="${langCode}">
                <head>
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
                <body class="${classes}">
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
          `${safeContextValue};${translationsScript}`,
          langCode
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
