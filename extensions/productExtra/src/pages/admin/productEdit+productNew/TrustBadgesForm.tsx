// @ts-nocheck
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Button } from '@components/common/ui/Button.js';
import IconPicker, { renderBadgeIcon } from '../../../components/IconPicker.js';

export default function TrustBadgesForm({ product }) {
  const initialBadges = product?.trustBadgesAdmin || [];
  const [badges, setBadges] = useState(
    initialBadges.length > 0
      ? initialBadges.map(b => ({ icon: b.icon || '', label: b.label }))
      : []
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const addBadge = () => {
    setBadges([...badges, { icon: '', label: '' }]);
  };

  const removeBadge = (index) => {
    setBadges(badges.filter((_, i) => i !== index));
  };

  const updateBadge = (index, field, val) => {
    const updated = [...badges];
    updated[index] = { ...updated[index], [field]: val };
    setBadges(updated);
  };

  const handleSave = async () => {
    if (!product?.productId) {
      setMessage({ type: 'error', text: 'Veuillez sauvegarder le produit d\'abord.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/products/${product.productId}/trust-badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ badges })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Badges de confiance sauvegardés !' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur de sauvegarde' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur de sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            🛡 Badges de Confiance
          </span>
        </CardTitle>
        <CardDescription>
          Configurez les badges affichés sur la page produit (ex: Livraison rapide, Paiement sécurisé).
          Cliquez sur le bouton icône pour choisir un émoji, coller du SVG ou importer un fichier .svg.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-start gap-2 p-3 border border-border rounded-lg bg-background">
              {/* Icon picker */}
              <div className="flex flex-col gap-1" style={{ width: '64px', flexShrink: 0 }}>
                <label className="text-xs text-muted-foreground">Icône</label>
                <IconPicker
                  value={badge.icon}
                  onChange={(v) => updateBadge(index, 'icon', v)}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Libellé</label>
                <input
                  type="text"
                  value={badge.label}
                  onChange={(e) => updateBadge(index, 'label', e.target.value)}
                  placeholder="Ex: Livraison rapide"
                  className="w-full border border-border rounded px-3 py-1.5 bg-background"
                />
              </div>
              <button
                type="button"
                onClick={() => removeBadge(index)}
                className="mt-4 text-destructive hover:text-destructive/80 p-1"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Preview */}
          {badges.length > 0 && (
            <div className="p-3 rounded-lg" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div className="text-xs font-medium mb-2 text-muted-foreground">Aperçu :</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {badges.map((badge, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#fff',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      fontSize: '14px',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {badge.icon && renderBadgeIcon(badge.icon, 20)}
                    <span style={{ fontWeight: 600 }}>{badge.label || '...'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              addBadge();
            }}
          >
            + Ajouter un badge
          </Button>

          <div className="flex gap-3 mt-2">
            <Button
              variant="default"
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
              isLoading={saving}
              disabled={saving}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder les badges'}
            </Button>
          </div>

          {message && (
            <div
              className="text-sm px-3 py-2 rounded"
              style={{
                color: message.type === 'success' ? '#065f46' : '#9a4b0f',
                background: message.type === 'success' ? '#d1fae5' : '#ffedd5'
              }}
            >
              {message.text}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 20
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      productId
      trustBadgesAdmin {
        trustBadgeId
        icon
        label
        sortOrder
      }
    }
  }
`;
