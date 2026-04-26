import { AppProvider } from '@components/common/context/app.js';
import ServerHtml from '@components/common/react/server/Server.js';
import React from 'react';
import { renderToString } from 'react-dom/server.js';

function renderHtml(route, js, css, contextData, langeCode, translationsScript = '') {
  // contextData is pure JSON; translationsScript is an optional JS snippet
  const source = renderToString(
    <AppProvider value={JSON.parse(contextData)}>
      <ServerHtml
        route={route}
        js={js}
        css={css}
        appContext={`var eContext = ${contextData};${translationsScript}`}
      />
    </AppProvider>
  );

  return `<!DOCTYPE html><html id="root" lang="${langeCode}">${source}</html>`;
}

export { renderHtml };
