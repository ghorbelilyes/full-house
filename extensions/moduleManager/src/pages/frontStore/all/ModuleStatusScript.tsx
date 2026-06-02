/**
 * Injects module statuses into the page as a <script> tag.
 * Available immediately as window.__moduleStatuses before React hydration.
 * Rendered on every storefront page via pages/frontStore/all/.
 */
import React from 'react';

interface StatusEntry {
  code: string;
  enabled: boolean;
}

export default function ModuleStatusScript({
  allModuleStatuses
}: {
  allModuleStatuses: StatusEntry[];
}) {
  const statusMap: Record<string, boolean> = {};
  for (const entry of allModuleStatuses || []) {
    statusMap[entry.code] = entry.enabled;
  }

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__moduleStatuses=${JSON.stringify(statusMap)};`
      }}
    />
  );
}

export const layout = {
  areaId: 'head',
  sortOrder: 1
};

export const query = `
  query Query {
    allModuleStatuses {
      code
      enabled
    }
  }
`;
