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

const SIZE_OPTIONS = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' }
];

const SIZE_STYLES = {
  sm: {
    padding: '6px 8px',
    iconSize: 14,
    iconBox: '20px',
    valueSize: '12px',
    labelSize: '9px',
    gap: '6px',
    borderRadius: '10px'
  },
  md: {
    padding: '10px',
    iconSize: 18,
    iconBox: '24px',
    valueSize: '14px',
    labelSize: '10px',
    gap: '8px',
    borderRadius: '12px'
  },
  lg: {
    padding: '14px 12px',
    iconSize: 24,
    iconBox: '32px',
    valueSize: '17px',
    labelSize: '12px',
    gap: '10px',
    borderRadius: '14px'
  }
};

export default function SpecBadgesForm({ product }) {
  const initialBadges = product?.specBadgesAdmin || [];
  const [badges, setBadges] = useState(
    initialBadges.length > 0
      ? initialBadges.map(b => ({
          icon: b.icon || '',
          value: b.value,
          label: b.label,
          badgeSize: b.badgeSize || 'md'
        }))
      : []
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const addBadge = () => {
    setBadges([...badges, { icon: '', value: '', label: '', badgeSize: 'md' }]);
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
      const res = await fetch(`/api/products/${product.productId}/spec-badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ badges })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Caractéristiques sauvegardées !' });
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
            📊 Caractéristiques (Spec Badges)
          </span>
        </CardTitle>
        <CardDescription>
          Configurez les blocs de caractéristiques affichés sous l'image produit.
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
                <label className="text-xs text-muted-foreground">Valeur</label>
                <input
                  type="text"
                  value={badge.value}
                  onChange={(e) => updateBadge(index, 'value', e.target.value)}
                  placeholder="Ex: 300"
                  className="w-full border border-border rounded px-3 py-1.5 bg-background"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Libellé</label>
                <input
                  type="text"
                  value={badge.label}
                  onChange={(e) => updateBadge(index, 'label', e.target.value)}
                  placeholder="Ex: MB/s Read"
                  className="w-full border border-border rounded px-3 py-1.5 bg-background"
                />
              </div>
              {/* Badge size selector */}
              <div className="flex flex-col gap-1" style={{ width: '72px', flexShrink: 0 }}>
                <label className="text-xs text-muted-foreground">Taille</label>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {SIZE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateBadge(index, 'badgeSize', opt.value)}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        fontSize: '11px',
                        fontWeight: badge.badgeSize === opt.value ? 700 : 500,
                        border: `1.5px solid ${badge.badgeSize === opt.value ? '#e48125' : '#d1d5db'}`,
                        borderRadius: '6px',
                        background: badge.badgeSize === opt.value ? '#fef3c7' : '#fff',
                        color: badge.badgeSize === opt.value ? '#e48125' : '#6b7280',
                        cursor: 'pointer',
                        lineHeight: 1.4,
                        textAlign: 'center'
                      }}
                      title={`Taille ${opt.label}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px' }}>
                {badges.map((badge, i) => {
                  const s = SIZE_STYLES[badge.badgeSize] || SIZE_STYLES.md;
                  return (
                    <div key={i} style={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      padding: s.padding,
                      borderRadius: s.borderRadius,
                      display: 'flex',
                      alignItems: 'center',
                      gap: s.gap
                    }}>
                      {badge.icon && (
                        <span style={{
                          width: s.iconBox,
                          height: s.iconBox,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {renderBadgeIcon(badge.icon, s.iconSize)}
                        </span>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: s.valueSize,
                          color: '#e48125',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {badge.value || '—'}
                        </div>
                        <div style={{
                          fontSize: s.labelSize,
                          color: '#6b7280',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {badge.label || '...'}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
            + Ajouter une caractéristique
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
              {saving ? 'Sauvegarde...' : 'Sauvegarder les caractéristiques'}
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
  sortOrder: 25
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      productId
      specBadgesAdmin {
        specBadgeId
        icon
        value
        label
        badgeSize
        sortOrder
      }
    }
  }
`;
