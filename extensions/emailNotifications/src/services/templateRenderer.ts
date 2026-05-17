import Handlebars from 'handlebars';
import sanitizeHtml from 'sanitize-html';

export type TemplateVariables = Record<string, any>;

const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags,
  'html',
  'body',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'span',
  'div',
  'img',
  'pre',
  'h1',
  'h2',
  'h3'
];

const allowedAttributes = {
  ...sanitizeHtml.defaults.allowedAttributes,
  '*': ['style', 'class', 'align', 'width', 'height', 'role'],
  a: ['href', 'name', 'target', 'style', 'class'],
  img: ['src', 'alt', 'width', 'height', 'style', 'class'],
  table: ['cellpadding', 'cellspacing', 'border', 'width', 'role', 'style']
};

function stripHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {}
  });
}

export function sanitizeTemplateVariables(
  data: TemplateVariables
): TemplateVariables {
  return Object.entries(data || {}).reduce((acc, [key, value]) => {
    if (value === null || value === undefined) {
      acc[key] = '';
    } else if (Array.isArray(value)) {
      acc[key] = value.map((item) =>
        typeof item === 'object'
          ? sanitizeTemplateVariables(item)
          : stripHtml(String(item))
      );
    } else if (typeof value === 'object') {
      acc[key] = sanitizeTemplateVariables(value);
    } else {
      acc[key] = stripHtml(String(value));
    }
    return acc;
  }, {} as TemplateVariables);
}

export function renderString(template: string, data: TemplateVariables) {
  const safeData = sanitizeTemplateVariables(data);
  return Handlebars.compile(template || '')(safeData);
}

export function renderEmailTemplate({
  subjectTemplate,
  htmlTemplate,
  textTemplate,
  data
}: {
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
  data: TemplateVariables;
}) {
  const safeData = sanitizeTemplateVariables(data);
  const subject = stripHtml(Handlebars.compile(subjectTemplate)(safeData));
  const html = sanitizeHtml(Handlebars.compile(htmlTemplate)(safeData), {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false
  });
  const text = stripHtml(Handlebars.compile(textTemplate)(safeData));
  return { subject, html, text };
}
