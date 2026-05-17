// @ts-nocheck
import { SettingMenu } from '@components/admin/SettingMenu.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Button } from '@components/common/ui/Button.js';
import {
  RefreshCw,
  Save,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

const fieldClass =
  'w-full border border-border rounded-md px-3 py-2 text-sm bg-background';
const labelClass = 'block text-xs font-semibold mb-1 text-muted-foreground';
const sectionClass = 'space-y-4';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function TextInput({ value, onChange, type = 'text', placeholder = '' }) {
  return (
    <input
      className={fieldClass}
      type={type}
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      className={fieldClass}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

function StatusMessage({ message }) {
  if (!message) return null;
  const Icon = message.type === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
        message.type === 'error'
          ? 'border-destructive/30 text-destructive'
          : 'border-green-600/30 text-green-700'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{message.text}</span>
    </div>
  );
}

function updateNested(object, path, value) {
  const next = { ...object };
  let cursor = next;
  path.slice(0, -1).forEach((key) => {
    cursor[key] = { ...(cursor[key] || {}) };
    cursor = cursor[key];
  });
  cursor[path[path.length - 1]] = value;
  return next;
}

export default function EmailNotificationSetting({
  settingsApi,
  templatesApi,
  testApi,
  logsApi
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [settings, setSettings] = useState(null);
  const [secrets, setSecrets] = useState({
    smtpPassword: '',
    sendgridApiKey: ''
  });
  const [secretStatus, setSecretStatus] = useState({});
  const [definitions, setDefinitions] = useState({});
  const [notificationTypes, setNotificationTypes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [testType, setTestType] = useState('order_placed_customer');
  const [testRecipient, setTestRecipient] = useState('');

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.templateKey === selectedTemplateKey),
    [templates, selectedTemplateKey]
  );

  async function loadAll() {
    setLoading(true);
    try {
      const [settingsRes, templatesRes, logsRes] = await Promise.all([
        fetch(settingsApi),
        fetch(templatesApi),
        fetch(logsApi)
      ]);
      const settingsJson = await settingsRes.json();
      const templatesJson = await templatesRes.json();
      const logsJson = await logsRes.json();

      setSettings(settingsJson.settings);
      setSecretStatus(settingsJson.secretStatus || {});
      setDefinitions(settingsJson.definitions || {});
      setNotificationTypes(settingsJson.notificationTypes || []);
      setTemplates(templatesJson.templates || []);
      setLogs(logsJson.logs || []);
      setSelectedTemplateKey(
        selectedTemplateKey ||
          templatesJson.templates?.[0]?.templateKey ||
          'order_placed_customer'
      );
      setTestRecipient(settingsJson.settings?.testEmailRecipient || '');
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function setSetting(path, value) {
    setSettings((current) => updateNested(current, path, value));
  }

  function setEvent(type, field, value) {
    setSettings((current) => ({
      ...current,
      events: {
        ...current.events,
        [type]: {
          ...current.events[type],
          [field]: value
        }
      }
    }));
  }

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(settingsApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, secrets })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Erreur de sauvegarde.');
      setSecrets({ smtpPassword: '', sendgridApiKey: '' });
      setMessage({ type: 'success', text: 'Configuration enregistrée.' });
      await loadAll();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function saveTemplate() {
    if (!selectedTemplate) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(templatesApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTemplate)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Erreur de sauvegarde.');
      setMessage({ type: 'success', text: 'Modèle enregistré.' });
      await loadAll();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(testApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationType: testType,
          recipient: testRecipient
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Erreur d'envoi.");
      setMessage({ type: 'success', text: json.data?.message || 'Email envoyé.' });
      await loadAll();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  function updateTemplate(field, value) {
    setTemplates((current) =>
      current.map((template) =>
        template.templateKey === selectedTemplateKey
          ? { ...template, [field]: value }
          : template
      )
    );
  }

  if (loading || !settings) {
    return (
      <div className="main-content-inner">
        <div className="grid grid-cols-6 gap-x-5 grid-flow-row">
          <div className="col-span-2">
            <SettingMenu />
          </div>
          <div className="col-span-4">
            <Card>
              <CardContent>
                <div className="py-8 text-sm text-muted-foreground">
                  Chargement...
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-5 grid-flow-row">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">Notifications email</h1>
              <p className="text-sm text-muted-foreground">
                Fournisseur, événements, modèles et journaux récents.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadAll}
                disabled={saving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button type="button" onClick={saveSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>

          <StatusMessage message={message} />

          <Card>
            <CardHeader>
              <CardTitle>Paramètres fournisseur</CardTitle>
              <CardDescription>SMTP ou SendGrid.</CardDescription>
            </CardHeader>
            <CardContent className={sectionClass}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fournisseur actif">
                  <SelectInput
                    value={settings.activeProvider}
                    onChange={(value) => setSetting(['activeProvider'], value)}
                    options={[
                      { value: 'sendgrid', label: 'SendGrid' },
                      { value: 'smtp', label: 'SMTP' }
                    ]}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">SMTP</div>
                    <div className="font-medium">{secretStatus.smtpPassword}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">SendGrid</div>
                    <div className="font-medium">{secretStatus.sendgridApiKey}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">SMTP</h3>
                  <Field label="Hôte SMTP">
                    <TextInput
                      value={settings.smtp.host}
                      onChange={(value) => setSetting(['smtp', 'host'], value)}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Port">
                      <TextInput
                        type="number"
                        value={settings.smtp.port}
                        onChange={(value) =>
                          setSetting(['smtp', 'port'], Number(value))
                        }
                      />
                    </Field>
                    <div className="flex items-end gap-3 pb-2">
                      <Toggle
                        checked={settings.smtp.secure}
                        onChange={(value) => setSetting(['smtp', 'secure'], value)}
                      />
                      <span className="text-sm">SSL/TLS</span>
                    </div>
                  </div>
                  <Field label="Nom utilisateur SMTP">
                    <TextInput
                      value={settings.smtp.username}
                      onChange={(value) => setSetting(['smtp', 'username'], value)}
                    />
                  </Field>
                  <Field label="Mot de passe SMTP">
                    <TextInput
                      type="password"
                      value={secrets.smtpPassword}
                      placeholder={secretStatus.smtpPassword}
                      onChange={(value) =>
                        setSecrets((current) => ({
                          ...current,
                          smtpPassword: value
                        }))
                      }
                    />
                  </Field>
                  <Field label="Email expéditeur SMTP">
                    <TextInput
                      value={settings.smtp.fromEmail}
                      onChange={(value) =>
                        setSetting(['smtp', 'fromEmail'], value)
                      }
                    />
                  </Field>
                  <Field label="Nom expéditeur SMTP">
                    <TextInput
                      value={settings.smtp.fromName}
                      onChange={(value) =>
                        setSetting(['smtp', 'fromName'], value)
                      }
                    />
                  </Field>
                  <Field label="Email de réponse SMTP">
                    <TextInput
                      value={settings.smtp.replyToEmail}
                      onChange={(value) =>
                        setSetting(['smtp', 'replyToEmail'], value)
                      }
                    />
                  </Field>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">SendGrid</h3>
                  <Field label="Clé API SendGrid">
                    <TextInput
                      type="password"
                      value={secrets.sendgridApiKey}
                      placeholder={secretStatus.sendgridApiKey}
                      onChange={(value) =>
                        setSecrets((current) => ({
                          ...current,
                          sendgridApiKey: value
                        }))
                      }
                    />
                  </Field>
                  <Field label="Email expéditeur SendGrid">
                    <TextInput
                      value={settings.sendgrid.fromEmail}
                      onChange={(value) =>
                        setSetting(['sendgrid', 'fromEmail'], value)
                      }
                    />
                  </Field>
                  <Field label="Nom expéditeur SendGrid">
                    <TextInput
                      value={settings.sendgrid.fromName}
                      onChange={(value) =>
                        setSetting(['sendgrid', 'fromName'], value)
                      }
                    />
                  </Field>
                  <Field label="Email de réponse SendGrid">
                    <TextInput
                      value={settings.sendgrid.replyToEmail}
                      onChange={(value) =>
                        setSetting(['sendgrid', 'replyToEmail'], value)
                      }
                    />
                  </Field>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>Paramètres communs à tous les emails.</CardDescription>
            </CardHeader>
            <CardContent className={sectionClass}>
              <div className="flex items-center gap-3">
                <Toggle
                  checked={settings.enabled}
                  onChange={(value) => setSetting(['enabled'], value)}
                />
                <span className="text-sm font-medium">
                  Activer toutes les notifications email
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email expéditeur">
                  <TextInput
                    value={settings.senderEmail}
                    onChange={(value) => setSetting(['senderEmail'], value)}
                  />
                </Field>
                <Field label="Nom expéditeur">
                  <TextInput
                    value={settings.senderName}
                    onChange={(value) => setSetting(['senderName'], value)}
                  />
                </Field>
                <Field label="Email de réponse">
                  <TextInput
                    value={settings.replyToEmail}
                    onChange={(value) => setSetting(['replyToEmail'], value)}
                  />
                </Field>
                <Field label="Email administrateur">
                  <TextInput
                    value={settings.adminEmail}
                    onChange={(value) => setSetting(['adminEmail'], value)}
                  />
                </Field>
                <Field label="Nom de la boutique">
                  <TextInput
                    value={settings.storeName}
                    onChange={(value) => setSetting(['storeName'], value)}
                  />
                </Field>
                <Field label="URL de la boutique">
                  <TextInput
                    value={settings.storeUrl}
                    onChange={(value) => setSetting(['storeUrl'], value)}
                  />
                </Field>
                <Field label="Destinataire de test">
                  <TextInput
                    value={settings.testEmailRecipient}
                    onChange={(value) => {
                      setSetting(['testEmailRecipient'], value);
                      setTestRecipient(value);
                    }}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Événements de notification</CardTitle>
              <CardDescription>Activation, sujets et modèles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-3">Événement</th>
                      <th className="py-2 pr-3">Description</th>
                      <th className="py-2 pr-3">Actif</th>
                      <th className="py-2 pr-3">Destinataire</th>
                      <th className="py-2 pr-3">Sujet</th>
                      <th className="py-2 pr-3">Modèle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notificationTypes.map((type) => {
                      const event = settings.events[type];
                      const definition = definitions[type] || {};
                      return (
                        <tr key={type} className="border-b align-top">
                          <td className="py-3 pr-3 font-mono text-xs">{type}</td>
                          <td className="py-3 pr-3 min-w-48">
                            <div className="font-medium">{definition.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {definition.description}
                            </div>
                            {type === 'order_status_changed' && (
                              <TextInput
                                value={(event.statuses || []).join(', ')}
                                onChange={(value) =>
                                  setEvent(
                                    type,
                                    'statuses',
                                    value
                                      .split(',')
                                      .map((item) => item.trim())
                                      .filter(Boolean)
                                  )
                                }
                              />
                            )}
                            {type === 'payment_status_changed' && (
                              <TextInput
                                value={(event.paymentStatuses || []).join(', ')}
                                onChange={(value) =>
                                  setEvent(
                                    type,
                                    'paymentStatuses',
                                    value
                                      .split(',')
                                      .map((item) => item.trim())
                                      .filter(Boolean)
                                  )
                                }
                              />
                            )}
                          </td>
                          <td className="py-3 pr-3">
                            <Toggle
                              checked={event.enabled}
                              onChange={(value) =>
                                setEvent(type, 'enabled', value)
                              }
                            />
                          </td>
                          <td className="py-3 pr-3 min-w-32">
                            <SelectInput
                              value={event.recipientType}
                              onChange={(value) =>
                                setEvent(type, 'recipientType', value)
                              }
                              options={[
                                { value: 'customer', label: 'Client' },
                                { value: 'admin', label: 'Admin' },
                                { value: 'custom', label: 'Personnalisé' }
                              ]}
                            />
                          </td>
                          <td className="py-3 pr-3 min-w-64">
                            <TextInput
                              value={event.subject}
                              onChange={(value) =>
                                setEvent(type, 'subject', value)
                              }
                            />
                          </td>
                          <td className="py-3 pr-3 min-w-44">
                            <SelectInput
                              value={event.templateKey}
                              onChange={(value) =>
                                setEvent(type, 'templateKey', value)
                              }
                              options={templates.map((template) => ({
                                value: template.templateKey,
                                label: template.name
                              }))}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modèles email</CardTitle>
              <CardDescription>HTML et texte de secours.</CardDescription>
            </CardHeader>
            <CardContent className={sectionClass}>
              <div className="flex items-end gap-3">
                <Field label="Modèle">
                  <SelectInput
                    value={selectedTemplateKey}
                    onChange={setSelectedTemplateKey}
                    options={templates.map((template) => ({
                      value: template.templateKey,
                      label: template.name
                    }))}
                  />
                </Field>
                <Button type="button" onClick={saveTemplate} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer le modèle
                </Button>
              </div>
              {selectedTemplate && (
                <div className="space-y-3">
                  <Field label="HTML">
                    <textarea
                      className={`${fieldClass} min-h-72 font-mono`}
                      value={selectedTemplate.htmlTemplate || ''}
                      onChange={(e) =>
                        updateTemplate('htmlTemplate', e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Texte">
                    <textarea
                      className={`${fieldClass} min-h-48 font-mono`}
                      value={selectedTemplate.textTemplate || ''}
                      onChange={(e) =>
                        updateTemplate('textTemplate', e.target.value)
                      }
                    />
                  </Field>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email de test</CardTitle>
              <CardDescription>Vérification du fournisseur actif.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 items-end">
                <Field label="Destinataire">
                  <TextInput value={testRecipient} onChange={setTestRecipient} />
                </Field>
                <Field label="Notification">
                  <SelectInput
                    value={testType}
                    onChange={setTestType}
                    options={notificationTypes.map((type) => ({
                      value: type,
                      label: type
                    }))}
                  />
                </Field>
                <Button type="button" onClick={sendTest} disabled={saving}>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer un test
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Journaux email</CardTitle>
              <CardDescription>Dernières tentatives.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Destinataire</th>
                      <th className="py-2 pr-3">Statut</th>
                      <th className="py-2 pr-3">Erreur</th>
                      <th className="py-2 pr-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="py-2 pr-3 font-mono text-xs">
                          {log.notificationType}
                        </td>
                        <td className="py-2 pr-3">{log.recipient}</td>
                        <td className="py-2 pr-3">{log.status}</td>
                        <td className="py-2 pr-3 max-w-64 truncate">
                          {log.errorMessage}
                        </td>
                        <td className="py-2 pr-3">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString('fr-TN')
                            : ''}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td
                          className="py-4 text-muted-foreground"
                          colSpan={5}
                        >
                          Aucun journal pour le moment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
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
    settingsApi: url(routeId: "emailNotificationSettings")
    templatesApi: url(routeId: "emailNotificationTemplates")
    testApi: url(routeId: "sendEmailNotificationTest")
    logsApi: url(routeId: "emailNotificationLogs")
  }
`;
