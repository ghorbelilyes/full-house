import React from 'react';

/**
 * Inline script to prevent flash of wrong theme on page load.
 * Must be placed in the <head> area and execute before body renders.
 */
export default function ThemeInit() {
  const themeScript = `
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
`.trim();

  return (
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  );
}

export const layout = {
  areaId: 'head',
  sortOrder: 1
};
