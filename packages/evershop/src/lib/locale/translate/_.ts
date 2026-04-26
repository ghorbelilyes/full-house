declare global {
  interface Window {
    __translations__?: Record<string, string>;
  }
}

export function _(text: string, values?: Record<string, string>): string {
  // Check runtime translation map (for language switching)
  let translated = text;
  if (
    typeof window !== 'undefined' &&
    window.__translations__ &&
    window.__translations__[text]
  ) {
    translated = window.__translations__[text];
  }

  // Check if the data is null, undefined or empty object
  if (!values || Object.keys(values).length === 0) {
    return translated;
  }
  const template = `${translated}`;
  return template.replace(/\${(.*?)}/g, (match, key) =>
    values[key.trim()] !== undefined ? values[key.trim()] : match
  );
}
