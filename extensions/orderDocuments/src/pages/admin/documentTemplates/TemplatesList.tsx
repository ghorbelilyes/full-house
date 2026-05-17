// @ts-nocheck
import React, { useState } from 'react';
import { PageHeading } from '@components/admin/PageHeading.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Button } from '@components/common/ui/Button.js';

const TYPE_LABELS = {
  facture: { label: 'Facture', color: '#e48125', bg: '#fef3e2' },
  bon_commande: { label: 'Bon de commande', color: '#2563eb', bg: '#eff6ff' },
  bon_livraison: { label: 'Bon de livraison', color: '#059669', bg: '#ecfdf5' }
};

const BUILT_IN_TYPES = [
  { type: 'facture', label: 'Facture' },
  { type: 'bon_commande', label: 'Bon de commande' },
  { type: 'bon_livraison', label: 'Bon de livraison' }
];

export default function DocumentTemplatesList({ templates, editUrl }) {
  const parsedTemplates = templates || [];
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (uuid) => {
    if (!confirm('Supprimer ce modèle ?')) return;
    setDeleting(uuid);
    try {
      const res = await fetch(`/api/document-templates/${uuid}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch {
      alert('Erreur réseau');
    }
    setDeleting(null);
  };

  return (
    <div>
      <PageHeading heading="Modèles de documents" />
      <div style={{ padding: '0 24px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Quick-start: create from built-in */}
        <Card style={{ marginBottom: 24 }}>
          <CardHeader>
            <CardTitle>Créer un nouveau modèle</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ marginBottom: 16, color: '#6b7280', fontSize: 13 }}>
              Choisissez un type pour créer un nouveau modèle basé sur le modèle par défaut.
              Vous pourrez le personnaliser dans l'éditeur.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {BUILT_IN_TYPES.map((bt) => {
                const info = TYPE_LABELS[bt.type];
                return (
                  <a
                    key={bt.type}
                    href={`${editUrl}?type=${bt.type}&from=builtin`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      border: `1px solid ${info.color}40`,
                      borderRadius: 10,
                      background: info.bg,
                      color: info.color,
                      fontWeight: 600,
                      fontSize: 13,
                      textDecoration: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {bt.label}
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Existing templates list */}
        <Card>
          <CardHeader>
            <CardTitle>Modèles enregistrés ({parsedTemplates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {parsedTemplates.length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                Aucun modèle personnalisé. Utilisez les boutons ci-dessus pour en créer un.
              </p>
            )}
            {parsedTemplates.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {parsedTemplates.map((tpl) => {
                  const info = TYPE_LABELS[tpl.type] || { label: tpl.type, color: '#6b7280', bg: '#f9fafb' };
                  return (
                    <div
                      key={tpl.uuid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        background: '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: info.bg,
                          color: info.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {info.label}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{tpl.name}</span>
                        {tpl.isDefault && (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            background: '#dcfce7',
                            color: '#16a34a'
                          }}>
                            PAR DÉFAUT
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a
                          href={`${editUrl}?uuid=${tpl.uuid}`}
                          style={{
                            padding: '6px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#374151',
                            textDecoration: 'none',
                            background: '#fff'
                          }}
                        >
                          Modifier
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(tpl.uuid)}
                          disabled={deleting === tpl.uuid}
                          style={{
                            padding: '6px 14px',
                            border: '1px solid #fecaca',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#dc2626',
                            background: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          {deleting === tpl.uuid ? '...' : 'Supprimer'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
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
    templates: documentTemplates {
      uuid
      type
      name
      isDefault
      createdAt
    }
    editUrl: url(routeId: "documentTemplateEdit")
  }
`;
