import { pool } from '@evershop/evershop/lib/postgres';
import { decode } from 'html-entities';
import {
  DEFAULT_TEMPLATES,
  NOTIFICATION_DEFINITIONS,
  NOTIFICATION_TYPES,
  NotificationType
} from './constants.js';

export type EmailTemplate = {
  templateKey: NotificationType;
  name: string;
  description: string;
  htmlTemplate: string;
  textTemplate: string;
  updatedAt?: string;
};

function toTemplate(row: Record<string, any>): EmailTemplate {
  return {
    templateKey: row.template_key,
    name: row.name,
    description: row.description || '',
    htmlTemplate: decodeTemplate(row.html_template),
    textTemplate: decodeTemplate(row.text_template),
    updatedAt: row.updated_at
  };
}

function decodeTemplate(value: string) {
  let result = value || '';
  for (let i = 0; i < 3; i += 1) {
    const decoded = decode(result);
    if (decoded === result) {
      break;
    }
    result = decoded;
  }
  return result;
}

export async function ensureDefaultTemplates() {
  for (const type of NOTIFICATION_TYPES) {
    const template = DEFAULT_TEMPLATES[type];
    await pool.query(
      `INSERT INTO email_notification_template
        (template_key, name, description, html_template, text_template)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (template_key) DO NOTHING`,
      [
        type,
        template.name,
        template.description,
        template.html,
        template.text
      ]
    );
  }
}

export async function getEmailTemplates() {
  await ensureDefaultTemplates();
  const result = await pool.query(
    `SELECT template_key, name, description, html_template, text_template, updated_at
      FROM email_notification_template
      ORDER BY email_notification_template_id ASC`
  );
  return result.rows.map(toTemplate);
}

export async function getEmailTemplate(templateKey: NotificationType) {
  await ensureDefaultTemplates();
  const result = await pool.query(
    `SELECT template_key, name, description, html_template, text_template, updated_at
      FROM email_notification_template
      WHERE template_key = $1`,
    [templateKey]
  );

  if (result.rows[0]) {
    return toTemplate(result.rows[0]);
  }

  const fallback = DEFAULT_TEMPLATES[templateKey];
  return {
    templateKey,
    name: fallback.name,
    description: fallback.description,
    htmlTemplate: fallback.html,
    textTemplate: fallback.text
  };
}

export async function saveEmailTemplate(body: Record<string, any>) {
  const templateKey = body.templateKey || body.template_key;
  if (!NOTIFICATION_TYPES.includes(templateKey)) {
    throw new Error('Modèle email invalide.');
  }

  const htmlTemplate =
    typeof body.htmlTemplate === 'string' ? decodeTemplate(body.htmlTemplate) : '';
  const textTemplate =
    typeof body.textTemplate === 'string' ? decodeTemplate(body.textTemplate) : '';

  if (!htmlTemplate.trim()) {
    throw new Error('Le modèle HTML est obligatoire.');
  }
  if (!textTemplate.trim()) {
    throw new Error('Le modèle texte est obligatoire.');
  }

  const definition = NOTIFICATION_DEFINITIONS[templateKey];
  const result = await pool.query(
    `INSERT INTO email_notification_template
      (template_key, name, description, html_template, text_template, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (template_key)
      DO UPDATE SET
        html_template = EXCLUDED.html_template,
        text_template = EXCLUDED.text_template,
        updated_at = CURRENT_TIMESTAMP
      RETURNING template_key, name, description, html_template, text_template, updated_at`,
    [
      templateKey,
      definition.label,
      definition.description,
      htmlTemplate,
      textTemplate
    ]
  );
  return toTemplate(result.rows[0]);
}
