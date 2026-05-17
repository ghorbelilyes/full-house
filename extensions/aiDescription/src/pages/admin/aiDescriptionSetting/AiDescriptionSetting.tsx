// @ts-nocheck
import { SettingMenu } from '@components/admin/SettingMenu.js';
import { Badge } from '@components/common/ui/Badge.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Bot, KeyRound, Save, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type ProviderCode = 'openai' | 'gemini';

type AiSettings = {
  enabled: boolean;
  provider: ProviderCode;
  model: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
  defaultTone: string;
  downloadImages: boolean;
};

type SecretStatus = {
  apiKeyConfigured: boolean;
  apiKeySource: 'admin' | 'env' | 'none';
};

const DEFAULT_SETTINGS: AiSettings = {
  enabled: true,
  provider: 'openai',
  model: 'gpt-4o',
  baseUrl: 'https://api.openai.com/v1',
  temperature: 0.7,
  maxTokens: 4096,
  defaultTone: 'professionnel',
  downloadImages: true
};

const PROVIDER_DEFAULTS: Record<
  ProviderCode,
  Pick<AiSettings, 'model' | 'baseUrl'>
> = {
  openai: {
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1'
  },
  gemini: {
    model: 'gemini-2.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
  }
};

function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      <span>{label}</span>
    </label>
  );
}

function apiKeyStatusLabel(status: SecretStatus) {
  if (status.apiKeySource === 'admin') {
    return 'Clé enregistrée dans admin';
  }
  if (status.apiKeySource === 'env') {
    return 'Clé active via environnement';
  }
  return 'Aucune clé configurée';
}

export default function AiDescriptionSetting({
  settingsApi,
  saveSettingsApi
}: {
  settingsApi: string;
  saveSettingsApi: string;
}) {
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_SETTINGS);
  const [secretStatus, setSecretStatus] = useState<SecretStatus>({
    apiKeyConfigured: false,
    apiKeySource: 'none'
  });
  const [apiKey, setApiKey] = useState('');
  const [clearApiKey, setClearApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      try {
        const res = await fetch(settingsApi, { credentials: 'same-origin' });
        const json = await res.json();
        if (cancelled) return;
        if (json.error) {
          setMessage({ type: 'error', text: json.error.message });
        } else {
          setSettings({ ...DEFAULT_SETTINGS, ...(json.settings || {}) });
          setSecretStatus(json.secretStatus || secretStatus);
        }
      } catch (e: any) {
        if (!cancelled) {
          setMessage({
            type: 'error',
            text: e.message || 'Impossible de charger les paramètres.'
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [settingsApi]);

  function updateSetting<K extends keyof AiSettings>(
    key: K,
    value: AiSettings[K]
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateProvider(provider: ProviderCode) {
    setSettings((current) => ({
      ...current,
      provider,
      model: PROVIDER_DEFAULTS[provider].model,
      baseUrl: PROVIDER_DEFAULTS[provider].baseUrl
    }));
  }

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(saveSettingsApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          settings,
          secrets: {
            apiKey
          },
          clearApiKey
        })
      });
      const json = await res.json();
      if (json.error) {
        setMessage({ type: 'error', text: json.error.message });
      } else {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...(json.data?.settings || settings)
        });
        setSecretStatus(json.data?.secretStatus || secretStatus);
        setApiKey('');
        setClearApiKey(false);
        setMessage({
          type: 'success',
          text: 'Paramètres IA enregistrés.'
        });
      }
    } catch (e: any) {
      setMessage({
        type: 'error',
        text: e.message || 'Erreur de sauvegarde.'
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-5 grid-flow-row">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  IA description produit
                </span>
              </CardTitle>
              <CardDescription>
                Gérez la clé API, le fournisseur et le modèle utilisés par le
                générateur de descriptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">
                  Chargement des paramètres...
                </div>
              ) : (
                <div className="grid gap-5">
                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {apiKeyStatusLabel(secretStatus)}
                      </span>
                    </div>
                    <Badge
                      variant={
                        secretStatus.apiKeyConfigured ? 'success' : 'warning'
                      }
                    >
                      {secretStatus.apiKeyConfigured
                        ? 'Configurée'
                        : 'À configurer'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Fournisseur</label>
                      <select
                        value={settings.provider}
                        onChange={(e) =>
                          updateProvider(e.target.value as ProviderCode)
                        }
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value="openai">OpenAI compatible</option>
                        <option value="gemini">Google Gemini</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Modèle</label>
                      <input
                        type="text"
                        value={settings.model}
                        onChange={(e) =>
                          updateSetting('model', e.target.value)
                        }
                        placeholder="Nom du modèle"
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Base URL</label>
                    <input
                      type="url"
                      value={settings.baseUrl}
                      onChange={(e) => updateSetting('baseUrl', e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      Nouvelle clé API
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={
                        secretStatus.apiKeyConfigured
                          ? 'Laisser vide pour conserver la clé actuelle'
                          : 'Coller la clé API'
                      }
                      disabled={clearApiKey}
                      className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      autoComplete="new-password"
                    />
                    <Toggle
                      checked={clearApiKey}
                      onChange={setClearApiKey}
                      label="Supprimer la clé API enregistrée"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        Température
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) =>
                          updateSetting(
                            'temperature',
                            Number(e.target.value)
                          )
                        }
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        Tokens maximum
                      </label>
                      <input
                        type="number"
                        min="512"
                        max="20000"
                        step="256"
                        value={settings.maxTokens}
                        onChange={(e) =>
                          updateSetting('maxTokens', Number(e.target.value))
                        }
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Ton par défaut</label>
                      <select
                        value={settings.defaultTone}
                        onChange={(e) =>
                          updateSetting('defaultTone', e.target.value)
                        }
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value="professionnel">Professionnel</option>
                        <option value="luxe">Luxe / premium</option>
                        <option value="convivial">Convivial</option>
                        <option value="technique">Technique</option>
                        <option value="jeune">Jeune / dynamique</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-md border border-border p-3">
                    <Toggle
                      checked={settings.enabled}
                      onChange={(value) => updateSetting('enabled', value)}
                      label="Activer le générateur IA"
                    />
                    <Toggle
                      checked={settings.downloadImages}
                      onChange={(value) =>
                        updateSetting('downloadImages', value)
                      }
                      label="Télécharger les images du fournisseur par défaut"
                    />
                  </div>

                  {message && (
                    <div
                      className={`rounded-md px-3 py-2 text-sm ${
                        message.type === 'success'
                          ? 'bg-green-500/10 text-green-700'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {message.text}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="destructive"
                type="button"
                onClick={() => {
                  setClearApiKey(true);
                  setApiKey('');
                }}
                disabled={loading || saving || !secretStatus.apiKeyConfigured}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer la clé
              </Button>
              <Button
                type="button"
                onClick={saveSettings}
                isLoading={saving}
                disabled={loading}
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    settingsApi: url(routeId: "aiDescriptionSettings")
    saveSettingsApi: url(routeId: "saveAiDescriptionSettings")
  }
`;
