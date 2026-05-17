// @ts-nocheck
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PageHeading } from '@components/admin/PageHeading.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Button } from '@components/common/ui/Button.js';

const TYPE_OPTIONS = [
  { value: 'facture', label: 'Facture', color: '#e48125' },
  { value: 'bon_commande', label: 'Bon de commande', color: '#2563eb' },
  { value: 'bon_livraison', label: 'Bon de livraison', color: '#059669' }
];

const VARIABLES = [
  { key: 'documentTitle', label: 'Titre du document' },
  { key: 'documentNumber', label: 'N° document' },
  { key: 'documentDate', label: 'Date (long)' },
  { key: 'documentDateShort', label: 'Date (court)' },
  { key: 'companyName', label: 'Nom entreprise' },
  { key: 'companyAddress', label: 'Adresse entreprise' },
  { key: 'companyPhone', label: 'Tél entreprise' },
  { key: 'companyEmail', label: 'Email entreprise' },
  { key: 'companyTaxId', label: 'Matricule fiscal' },
  { key: 'companyRc', label: 'Registre commerce' },
  { key: 'orderNumber', label: 'N° commande' },
  { key: 'orderDate', label: 'Date commande' },
  { key: 'customerName', label: 'Nom client' },
  { key: 'customerEmail', label: 'Email client' },
  { key: 'shippingAddressHtml', label: 'Adresse livraison' },
  { key: 'billingAddressHtml', label: 'Adresse facturation' },
  { key: 'itemsRowsHtml', label: 'Lignes articles' },
  { key: 'itemCount', label: 'Nb lignes' },
  { key: 'totalQty', label: 'Qté totale' },
  { key: 'subTotal', label: 'Sous-total' },
  { key: 'discount', label: 'Remise' },
  { key: 'shippingFee', label: 'Frais livraison' },
  { key: 'taxAmount', label: 'TVA' },
  { key: 'grandTotal', label: 'Total TTC' },
  { key: 'paymentMethod', label: 'Mode paiement' },
  { key: 'paymentStatus', label: 'Statut paiement' },
  { key: 'shippingMethod', label: 'Mode livraison' },
  { key: 'shipmentStatus', label: 'Statut livraison' },
  { key: 'shippingNote', label: 'Notes livraison' }
];

export default function TemplateEditor({ templateData, backUrl }) {
  const parsed = templateData || {};

  const [name, setName] = useState(parsed?.name || '');
  const [type, setType] = useState(parsed?.type || 'facture');
  const [content, setContent] = useState(parsed?.content || '');
  const [isDefault, setIsDefault] = useState(parsed?.isDefault || false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const [editorHeight, setEditorHeight] = useState(600);

  const iframeRef = useRef(null);
  const textareaRef = useRef(null);
  const isNew = parsed?.isNew !== false && !parsed?.uuid;

  // Auto-preview with debounce
  const previewTimer = useRef(null);
  const doPreview = useCallback(async (html, docType) => {
    try {
      const res = await fetch('/api/document-templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: html, type: docType })
      });
      if (res.ok) {
        const text = await res.text();
        setPreviewHtml(text);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!showPreview) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => doPreview(content, type), 800);
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [content, type, showPreview, doPreview]);

  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(previewHtml);
      doc.close();
    }
  }, [previewHtml]);

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Le nom est requis' });
      return;
    }
    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Le contenu est requis' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/document-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: isNew ? undefined : parsed.uuid,
          type,
          name: name.trim(),
          content,
          is_default: isDefault
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Modèle enregistré avec succès !' });
        const data = await res.json();
        if (isNew && data?.data?.template?.uuid) {
          // Redirect to edit the newly created template
          window.location.href = `${backUrl}/../document-template/edit?uuid=${data.data.template.uuid}`;
        }
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.message || 'Erreur lors de la sauvegarde' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    }
    setSaving(false);
  };

  const insertVariable = (varKey) => {
    const tag = `{{${varKey}}}`;
    if (textareaRef.current) {
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent = content.substring(0, start) + tag + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + tag.length;
        ta.focus();
      }, 0);
    } else {
      setContent(content + tag);
    }
  };

  return (
    <div>
      <PageHeading
        backUrl={backUrl}
        heading={isNew ? 'Nouveau modèle de document' : `Modifier : ${parsed?.name || ''}`}
      />
      <div style={{ padding: '0 24px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Message */}
        {message && (
          <div style={{
            padding: '10px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#16a34a' : '#dc2626',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Toolbar */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Masquer l\'aperçu' : 'Aperçu en direct'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowVars(!showVars)}
          >
            {showVars ? 'Masquer les variables' : 'Variables disponibles'}
          </Button>
        </div>

        {/* Variables reference panel */}
        {showVars && (
          <Card style={{ marginBottom: 16 }}>
            <CardHeader>
              <CardTitle>Variables disponibles — cliquez pour insérer</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                Utilisez <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{'{{nomVariable}}'}</code> dans le HTML.
                Blocs conditionnels : <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{'{{#if nomVariable}}...{{/if}}'}</code>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    title={`Insérer {{${v.key}}}`}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      background: '#fafafa',
                      cursor: 'pointer',
                      color: '#374151',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ color: '#9ca3af' }}>{'{{ '}</span>
                    {v.key}
                    <span style={{ color: '#9ca3af' }}>{' }}'}</span>
                    <span style={{ marginLeft: 6, fontSize: 10, color: '#9ca3af', fontFamily: 'sans-serif' }}>
                      {v.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
              Nom du modèle
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Facture — Design moderne"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 13
              }}
            />
          </div>
          <div style={{ width: 200 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
              Type de document
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={!isNew}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 13,
                background: isNew ? '#fff' : '#f3f4f6'
              }}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Par défaut
            </label>
          </div>
        </div>

        {/* Editor + Preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr',
          gap: 16,
          marginBottom: 24
        }}>
          {/* Code editor */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6
            }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                Code HTML du modèle
              </label>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                {content.length} caractères
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%',
                height: editorHeight,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: 12,
                lineHeight: 1.6,
                padding: '16px',
                border: '1px solid #d1d5db',
                borderRadius: 10,
                resize: 'vertical',
                background: '#1e1e2e',
                color: '#cdd6f4',
                tabSize: 2,
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                overflowX: 'auto'
              }}
            />
          </div>

          {/* Live preview */}
          {showPreview && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6
              }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  Aperçu (données fictives)
                </label>
                <button
                  type="button"
                  onClick={() => doPreview(content, type)}
                  style={{
                    padding: '3px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 11,
                    background: '#fff',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  Rafraîchir
                </button>
              </div>
              <div style={{
                border: '1px solid #d1d5db',
                borderRadius: 10,
                overflow: 'hidden',
                height: editorHeight,
                background: '#fff'
              }}>
                <iframe
                  ref={iframeRef}
                  title="Aperçu du modèle"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
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
    templateData: documentTemplateEdit {
      uuid
      type
      name
      content
      isDefault
      isNew
    }
    backUrl: url(routeId: "documentTemplates")
  }
`;
