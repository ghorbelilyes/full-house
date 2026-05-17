// @ts-nocheck
import { SettingMenu } from '@components/admin/SettingMenu.js';
import { Form, useFormContext } from '@components/common/form/Form.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Button } from '@components/common/ui/Button.js';
import React, { useState, useEffect } from 'react';
import IconPicker, { renderBadgeIcon } from '../../../components/IconPicker.js';

/* ── Form fields (has access to react-hook-form context) ─ */
function HeaderBarFields({ setting }) {
  const [enabled, setEnabled] = useState(setting?.headerBarEnabled ?? false);
  const initialMessages = setting?.headerBarMessages || [];
  const [messages, setMessages] = useState(
    initialMessages.length > 0
      ? initialMessages.map(m => ({
          icon: m.icon || '',
          text: m.text || '',
          linkText: m.linkText || '',
          linkUrl: m.linkUrl || ''
        }))
      : []
  );
  const { setValue, register } = useFormContext();

  // Register fields with react-hook-form
  useEffect(() => {
    register('headerBarEnabled');
    register('headerBarMessages');
    setValue('headerBarEnabled', enabled ? '1' : '0');
    setValue('headerBarMessages', messages);
  }, []);

  // Sync enabled
  useEffect(() => {
    setValue('headerBarEnabled', enabled ? '1' : '0');
  }, [enabled]);

  // Sync messages
  useEffect(() => {
    setValue('headerBarMessages', messages);
  }, [messages]);

  const addMessage = () => {
    setMessages([...messages, { icon: '', text: '', linkText: '', linkUrl: '' }]);
  };

  const removeMessage = (index) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const updateMessage = (index, field, val) => {
    const updated = [...messages];
    updated[index] = { ...updated[index], [field]: val };
    setMessages(updated);
  };

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="headerBarToggle"
          className="text-sm font-medium"
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          Activer la barre d'annonce
        </label>
        <button
          type="button"
          id="headerBarToggle"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            background: enabled ? '#f97316' : '#d1d5db',
            transition: 'background 0.2s'
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: enabled ? '22px' : '2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}
          />
        </button>
      </div>

      {enabled && (
        <>
          {/* Message list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  background: '#fafafa'
                }}
              >
                {/* Icon picker */}
                <div style={{ flexShrink: 0, paddingTop: '18px', width: '56px' }}>
                  <IconPicker
                    value={msg.icon}
                    onChange={(v) => updateMessage(index, 'icon', v)}
                  />
                </div>

                {/* Fields */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>
                      Texte du message
                    </label>
                    <input
                      type="text"
                      value={msg.text}
                      onChange={(e) => updateMessage(index, 'text', e.target.value)}
                      placeholder="Ex: Livraison gratuite à partir de 100 TND"
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '7px 10px',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>
                        Texte du lien (optionnel)
                      </label>
                      <input
                        type="text"
                        value={msg.linkText}
                        onChange={(e) => updateMessage(index, 'linkText', e.target.value)}
                        placeholder="Ex: En savoir plus"
                        style={{
                          width: '100%',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '7px 10px',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>
                        URL du lien (optionnel)
                      </label>
                      <input
                        type="text"
                        value={msg.linkUrl}
                        onChange={(e) => updateMessage(index, 'linkUrl', e.target.value)}
                        placeholder="Ex: /pages/livraison"
                        style={{
                          width: '100%',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '7px 10px',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeMessage(index)}
                  style={{
                    flexShrink: 0,
                    marginTop: '18px',
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px'
                  }}
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              addMessage();
            }}
          >
            + Ajouter un message
          </Button>

          {/* Preview */}
          {messages.length > 0 && messages.some(m => m.text) && (
            <div style={{
              marginTop: '4px',
              padding: '12px 20px',
              background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginRight: '4px' }}>
                Aperçu :
              </span>
              {messages.filter(m => m.text).map((msg, i) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <span style={{ width: '1px', height: '20px', background: '#d1d5db', flexShrink: 0 }} />
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {msg.icon && renderBadgeIcon(msg.icon, 16)}
                    <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                    {msg.linkText && (
                      <a href="#" style={{ textDecoration: 'underline', marginLeft: '2px' }}
                         onClick={(e) => e.preventDefault()}>
                        {msg.linkText}
                      </a>
                    )}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function HeaderBarSetting({ saveSettingApi, setting }) {
  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-5 grid-flow-row">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4">
          <Form method="POST" id="headerBarSetting" action={saveSettingApi}>
            <Card>
              <CardHeader>
                <CardTitle>Barre d'annonce</CardTitle>
                <CardDescription>
                  Configurez les messages affichés dans la barre en haut du site.
                  Ajoutez autant de messages que nécessaire. Chaque message peut avoir une icône et un lien.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HeaderBarFields setting={setting} />
              </CardContent>
            </Card>
          </Form>
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
    saveSettingApi: url(routeId: "saveSetting")
    setting {
      headerBarEnabled
      headerBarMessages {
        icon
        text
        linkText
        linkUrl
      }
    }
  }
`;
