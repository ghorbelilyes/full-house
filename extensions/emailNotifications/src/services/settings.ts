import { getBrandStoreNameFallback } from '@evershop/evershop/lib/branding/getBrandConfig.js';
import { pool } from '@evershop/evershop/lib/postgres';
import { getConfig } from '@evershop/evershop/lib/util/getConfig';
import { getBaseUrl } from '@evershop/evershop/lib/util/getBaseUrl';
import { refreshSetting } from '@evershop/evershop/setting/services';
import {
  DEFAULT_EVENT_SETTINGS,
  DEFAULT_SETTINGS,
  EmailNotificationSecrets,
  EmailNotificationSettings,
  EmailProviderCode,
  NOTIFICATION_TYPES,
  SECRETS_KEY,
  SETTINGS_KEY
} from './constants.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseJson<T>(value: unknown, fallback: T): T {
  if (!value) {
    return fallback;
  }
  if (typeof value !== 'string') {
    return value as T;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function env(name: string, fallback = '') {
  return process.env[name] || fallback;
}

function envBool(name: string, fallback = false) {
  const value = env(name);
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function envInt(name: string, fallback: number) {
  const value = parseInt(env(name), 10);
  return Number.isFinite(value) ? value : fallback;
}

function cleanString(value: unknown, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  return value.trim();
}

function cleanStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanString(item))
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

function normalizeProvider(value: unknown): EmailProviderCode {
  return value === 'smtp' ? 'smtp' : 'sendgrid';
}

function normalizeEmail(value: unknown, field: string, required = false) {
  const email = cleanString(value);
  if (!email) {
    if (required) {
      throw new Error(`${field} est obligatoire.`);
    }
    return '';
  }
  if (!emailRegex.test(email)) {
    throw new Error(`${field} est invalide.`);
  }
  return email;
}

function mergeSettings(
  saved: Partial<EmailNotificationSettings>
): EmailNotificationSettings {
  const events = { ...DEFAULT_EVENT_SETTINGS };
  NOTIFICATION_TYPES.forEach((type) => {
    events[type] = {
      ...DEFAULT_EVENT_SETTINGS[type],
      ...(saved.events?.[type] || {}),
      statuses:
        saved.events?.[type]?.statuses || DEFAULT_EVENT_SETTINGS[type].statuses,
      paymentStatuses:
        saved.events?.[type]?.paymentStatuses ||
        DEFAULT_EVENT_SETTINGS[type].paymentStatuses
    };
  });

  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    activeProvider: normalizeProvider(saved.activeProvider),
    smtp: {
      ...DEFAULT_SETTINGS.smtp,
      ...(saved.smtp || {})
    },
    sendgrid: {
      ...DEFAULT_SETTINGS.sendgrid,
      ...(saved.sendgrid || {})
    },
    events
  };
}

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  const result = await pool.query('SELECT value FROM setting WHERE name = $1', [
    key
  ]);
  return parseJson<T>(result.rows[0]?.value, fallback);
}

async function writeJsonSetting(key: string, value: unknown) {
  await pool.query(
    `INSERT INTO setting (name, value, is_json)
      VALUES ($1, $2, TRUE)
      ON CONFLICT (name)
      DO UPDATE SET value = EXCLUDED.value, is_json = TRUE`,
    [key, JSON.stringify(value)]
  );
}

function withEnvFallbacks(
  settings: EmailNotificationSettings,
  secrets: EmailNotificationSecrets
): EmailNotificationSettings {
  const homeUrl = getConfig('shop.homeUrl', '') || getBaseUrl();
  const activeProvider =
    settings.activeProvider ||
    (env('SMTP_HOST') ? 'smtp' : 'sendgrid');

  const storeName =
    settings.storeName ||
    env('STORE_NAME') ||
    getBrandStoreNameFallback() ||
    getConfig('shop.name', '');
  const storeUrl = settings.storeUrl || env('STORE_URL') || homeUrl;
  const senderEmail =
    settings.senderEmail ||
    env('EMAIL_FROM') ||
    env('SENDGRID_FROM_EMAIL') ||
    env('SMTP_FROM_EMAIL');
  const senderName =
    settings.senderName ||
    env('EMAIL_FROM_NAME') ||
    env('SENDGRID_FROM_NAME') ||
    env('SMTP_FROM_NAME') ||
    storeName;
  const replyToEmail =
    settings.replyToEmail ||
    env('SENDGRID_REPLY_TO_EMAIL') ||
    env('SMTP_REPLY_TO_EMAIL') ||
    senderEmail;
  const adminEmail = settings.adminEmail || env('ADMIN_EMAIL') || senderEmail;

  return {
    ...settings,
    activeProvider,
    senderEmail,
    senderName,
    replyToEmail,
    adminEmail,
    storeName,
    storeUrl,
    smtp: {
      ...settings.smtp,
      host: settings.smtp.host || env('SMTP_HOST'),
      port: settings.smtp.port || envInt('SMTP_PORT', 587),
      secure:
        typeof settings.smtp.secure === 'boolean'
          ? settings.smtp.secure
          : envBool('SMTP_SECURE', false),
      username: settings.smtp.username || env('SMTP_USER'),
      fromEmail:
        settings.smtp.fromEmail || env('SMTP_FROM_EMAIL') || senderEmail,
      fromName: settings.smtp.fromName || env('SMTP_FROM_NAME') || senderName,
      replyToEmail:
        settings.smtp.replyToEmail ||
        env('SMTP_REPLY_TO_EMAIL') ||
        replyToEmail
    },
    sendgrid: {
      ...settings.sendgrid,
      fromEmail:
        settings.sendgrid.fromEmail ||
        env('SENDGRID_FROM_EMAIL') ||
        senderEmail,
      fromName:
        settings.sendgrid.fromName ||
        env('SENDGRID_FROM_NAME') ||
        senderName,
      replyToEmail:
        settings.sendgrid.replyToEmail ||
        env('SENDGRID_REPLY_TO_EMAIL') ||
        replyToEmail
    }
  };
}

export async function getEmailNotificationSettings() {
  const saved = await readSetting<Partial<EmailNotificationSettings>>(
    SETTINGS_KEY,
    {}
  );
  return mergeSettings(saved);
}

export async function getEmailNotificationSecrets() {
  return await readSetting<EmailNotificationSecrets>(SECRETS_KEY, {});
}

export async function getEffectiveEmailNotificationSettings() {
  const settings = await getEmailNotificationSettings();
  const secrets = await getEmailNotificationSecrets();
  return withEnvFallbacks(settings, secrets);
}

export async function getSecretStatuses() {
  const secrets = await getEmailNotificationSecrets();
  return {
    smtpPassword:
      secrets.smtpPassword || env('SMTP_PASSWORD')
        ? 'Configured'
        : 'Not configured',
    sendgridApiKey:
      secrets.sendgridApiKey || env('SENDGRID_API_KEY')
        ? 'Configured'
        : 'Not configured'
  };
}

export async function getProviderSecret(provider: EmailProviderCode) {
  const secrets = await getEmailNotificationSecrets();
  if (provider === 'smtp') {
    return secrets.smtpPassword || env('SMTP_PASSWORD');
  }
  return secrets.sendgridApiKey || env('SENDGRID_API_KEY');
}

export function normalizeSettingsPayload(
  body: Record<string, any>
): EmailNotificationSettings {
  const base = mergeSettings(body || {});
  const activeProvider = normalizeProvider(base.activeProvider);

  const normalized: EmailNotificationSettings = {
    ...base,
    enabled: base.enabled === true || String(base.enabled) === 'true',
    activeProvider,
    senderEmail: normalizeEmail(base.senderEmail, 'Email expéditeur'),
    senderName: cleanString(base.senderName),
    replyToEmail: normalizeEmail(base.replyToEmail, 'Email de réponse'),
    adminEmail: normalizeEmail(base.adminEmail, 'Email administrateur'),
    storeName: cleanString(base.storeName),
    storeUrl: cleanString(base.storeUrl),
    testEmailRecipient: normalizeEmail(
      base.testEmailRecipient,
      'Email de test'
    ),
    smtp: {
      host: cleanString(base.smtp.host),
      port: Number(base.smtp.port || 587),
      secure:
        base.smtp.secure === true || String(base.smtp.secure) === 'true',
      username: cleanString(base.smtp.username),
      fromEmail: normalizeEmail(base.smtp.fromEmail, 'Email SMTP expéditeur'),
      fromName: cleanString(base.smtp.fromName),
      replyToEmail: normalizeEmail(
        base.smtp.replyToEmail,
        'Email SMTP de réponse'
      )
    },
    sendgrid: {
      fromEmail: normalizeEmail(
        base.sendgrid.fromEmail,
        'Email SendGrid expéditeur'
      ),
      fromName: cleanString(base.sendgrid.fromName),
      replyToEmail: normalizeEmail(
        base.sendgrid.replyToEmail,
        'Email SendGrid de réponse'
      )
    },
    events: { ...base.events }
  };

  NOTIFICATION_TYPES.forEach((type) => {
    const event = base.events[type] || DEFAULT_EVENT_SETTINGS[type];
    normalized.events[type] = {
      ...DEFAULT_EVENT_SETTINGS[type],
      ...event,
      enabled: event.enabled === true || String(event.enabled) === 'true',
      recipientType:
        event.recipientType === 'admin' || event.recipientType === 'custom'
          ? event.recipientType
          : 'customer',
      subject: cleanString(
        event.subject,
        DEFAULT_EVENT_SETTINGS[type].subject
      ),
      templateKey: NOTIFICATION_TYPES.includes(event.templateKey)
        ? event.templateKey
        : DEFAULT_EVENT_SETTINGS[type].templateKey,
      statuses:
        cleanStringArray(event.statuses).length > 0
          ? cleanStringArray(event.statuses)
          : DEFAULT_EVENT_SETTINGS[type].statuses,
      paymentStatuses:
        cleanStringArray(event.paymentStatuses).length > 0
          ? cleanStringArray(event.paymentStatuses)
          : DEFAULT_EVENT_SETTINGS[type].paymentStatuses
    };
  });

  if (normalized.smtp.port < 1 || normalized.smtp.port > 65535) {
    throw new Error('Le port SMTP est invalide.');
  }

  return normalized;
}

export async function saveEmailNotificationSettings(
  body: Record<string, any>
) {
  const normalized = normalizeSettingsPayload(body.settings || body);
  const currentSecrets = await getEmailNotificationSecrets();
  const secrets: EmailNotificationSecrets = { ...currentSecrets };
  const secretPayload = body.secrets || {};

  if (typeof secretPayload.smtpPassword === 'string') {
    const value = secretPayload.smtpPassword.trim();
    if (value) {
      secrets.smtpPassword = value;
    }
  }

  if (typeof secretPayload.sendgridApiKey === 'string') {
    const value = secretPayload.sendgridApiKey.trim();
    if (value) {
      secrets.sendgridApiKey = value;
    }
  }

  await writeJsonSetting(SETTINGS_KEY, normalized);
  await writeJsonSetting(SECRETS_KEY, secrets);
  await refreshSetting();
  return normalized;
}

export async function getAdminSettingsResponse() {
  const settings = await getEffectiveEmailNotificationSettings();
  const rawSettings = await getEmailNotificationSettings();
  return {
    settings: {
      ...settings,
      enabled: rawSettings.enabled,
      events: rawSettings.events
    },
    secretStatus: await getSecretStatuses()
  };
}
