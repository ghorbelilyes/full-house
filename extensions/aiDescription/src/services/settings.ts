import { pool } from '@evershop/evershop/lib/postgres';
import { refreshSetting } from '@evershop/evershop/setting/services';

export type AiProviderCode = 'openai' | 'gemini';

export type AiDescriptionSettings = {
  enabled: boolean;
  provider: AiProviderCode;
  model: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
  defaultTone: string;
  downloadImages: boolean;
};

export type AiDescriptionSecrets = {
  apiKey?: string;
};

export type EffectiveAiDescriptionSettings = AiDescriptionSettings & {
  apiKey: string;
  apiKeySource: 'admin' | 'env' | 'none';
};

const SETTINGS_KEY = 'aiDescriptionSettings';
const SECRETS_KEY = 'aiDescriptionSecrets';

const DEFAULT_SETTINGS: AiDescriptionSettings = {
  enabled: true,
  provider: 'openai',
  model: '',
  baseUrl: '',
  temperature: 0.7,
  maxTokens: 4096,
  defaultTone: 'professionnel',
  downloadImages: true
};

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

function cleanString(value: unknown, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const cleaned = value.trim();
  return cleaned || fallback;
}

function normalizeProvider(value: unknown): AiProviderCode {
  return value === 'gemini' ? 'gemini' : 'openai';
}

function normalizeBaseUrl(provider: AiProviderCode, value: string) {
  const cleaned = value.trim().replace(/\/+$/, '');
  if (provider === 'gemini') {
    return cleaned.replace(/\/openai$/i, '');
  }
  return cleaned;
}

function normalizeModel(provider: AiProviderCode, value: string) {
  const cleaned = value.trim();
  if (provider === 'gemini') {
    return cleaned.replace(/^models\//i, '');
  }
  return cleaned;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
  return fallback;
}

function normalizeNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

function mergeSettings(
  saved: Partial<AiDescriptionSettings> = {}
): AiDescriptionSettings {
  const provider = normalizeProvider(saved.provider);
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    enabled: normalizeBoolean(saved.enabled, DEFAULT_SETTINGS.enabled),
    provider,
    model: normalizeModel(provider, cleanString(saved.model)),
    baseUrl: normalizeBaseUrl(provider, cleanString(saved.baseUrl)),
    temperature: normalizeNumber(
      saved.temperature,
      DEFAULT_SETTINGS.temperature,
      0,
      2
    ),
    maxTokens: Math.round(
      normalizeNumber(saved.maxTokens, DEFAULT_SETTINGS.maxTokens, 512, 20000)
    ),
    defaultTone: cleanString(saved.defaultTone, DEFAULT_SETTINGS.defaultTone),
    downloadImages: normalizeBoolean(
      saved.downloadImages,
      DEFAULT_SETTINGS.downloadImages
    )
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

function getEnvApiKey(provider: AiProviderCode) {
  if (provider === 'gemini') {
    return env('GEMINI_API_KEY');
  }
  return env('AI_DESCRIPTION_API_KEY') || env('OPENAI_API_KEY');
}

function getFallbackModel(provider: AiProviderCode) {
  if (provider === 'gemini') {
    return env('GEMINI_MODEL') || 'gemini-2.0-flash';
  }
  return env('AI_DESCRIPTION_MODEL') || env('OPENAI_MODEL') || 'gpt-4o';
}

function getFallbackBaseUrl(provider: AiProviderCode) {
  if (provider === 'gemini') {
    return (
      env('GEMINI_BASE_URL') ||
      'https://generativelanguage.googleapis.com/v1beta'
    );
  }
  return env('AI_DESCRIPTION_BASE_URL') || 'https://api.openai.com/v1';
}

export async function getAiDescriptionSettings() {
  const saved = await readSetting<Partial<AiDescriptionSettings>>(
    SETTINGS_KEY,
    {}
  );
  return mergeSettings(saved);
}

export async function getAiDescriptionSecrets() {
  return await readSetting<AiDescriptionSecrets>(SECRETS_KEY, {});
}

export async function getEffectiveAiDescriptionSettings(): Promise<EffectiveAiDescriptionSettings> {
  const settings = await getAiDescriptionSettings();
  const secrets = await getAiDescriptionSecrets();
  const envApiKey = getEnvApiKey(settings.provider);
  const apiKey = cleanString(secrets.apiKey) || envApiKey;

  return {
    ...settings,
    model: settings.model || getFallbackModel(settings.provider),
    baseUrl: normalizeBaseUrl(
      settings.provider,
      settings.baseUrl || getFallbackBaseUrl(settings.provider)
    ),
    apiKey,
    apiKeySource: cleanString(secrets.apiKey)
      ? 'admin'
      : envApiKey
        ? 'env'
        : 'none'
  };
}

export function normalizeSettingsPayload(
  body: Record<string, any>
): AiDescriptionSettings {
  return mergeSettings(body || {});
}

export async function saveAiDescriptionSettings(body: Record<string, any>) {
  const normalized = normalizeSettingsPayload(body.settings || body);
  const currentSecrets = await getAiDescriptionSecrets();
  const secrets: AiDescriptionSecrets = { ...currentSecrets };
  const secretPayload = body.secrets || {};

  if (body.clearApiKey === true) {
    delete secrets.apiKey;
  } else if (typeof secretPayload.apiKey === 'string') {
    const value = secretPayload.apiKey.trim();
    if (value) {
      secrets.apiKey = value;
    }
  }

  await writeJsonSetting(SETTINGS_KEY, normalized);
  await writeJsonSetting(SECRETS_KEY, secrets);
  await refreshSetting();

  return normalized;
}

export async function getAdminAiDescriptionSettingsResponse() {
  const settings = await getEffectiveAiDescriptionSettings();
  return {
    settings: {
      enabled: settings.enabled,
      provider: settings.provider,
      model: settings.model,
      baseUrl: settings.baseUrl,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      defaultTone: settings.defaultTone,
      downloadImages: settings.downloadImages
    },
    secretStatus: {
      apiKeyConfigured: settings.apiKeySource !== 'none',
      apiKeySource: settings.apiKeySource
    }
  };
}
