// @ts-nocheck
import React, { useState, useRef } from 'react';

/* ── Categorised emoji library ──────────────────────────── */
const ICON_CATEGORIES = [
  {
    name: 'Tech & Électronique',
    icons: ['⚡', '🔋', '💾', '🖥', '📱', '💻', '⌨️', '🖱', '🖨', '📡', '📶', '🔌', '💡', '📺', '🎮', '🕹', '📷', '📸', '🎥', '🎬', '📹', '🔊', '🔉', '🎧', '🎤', '📻', '📠', '💿', '📀', '🧲']
  },
  {
    name: 'Mesure & Performance',
    icons: ['📊', '📈', '📉', '📏', '📐', '⏱', '⏰', '🌡', '🎯', '⚙️', '🔧', '🔩', '🛠', '🧪', '🔬', '🔭', '🧮', '📝', '✏️', '📌']
  },
  {
    name: 'Confiance & Sécurité',
    icons: ['🚚', '🔒', '🛡', '✅', '⭐', '🏆', '💯', '🔑', '🛡️', '🔐', '🎖', '🏅', '👑', '💎', '🤝', '👍', '💪', '❤️', '🌟', '✨']
  },
  {
    name: 'Commerce & Livraison',
    icons: ['📦', '🎁', '💳', '🛒', '🛍', '💰', '💵', '🏷', '↩️', '🔄', '📋', '📃', '🧾', '📬', '📫', '✈️', '🚀', '🏠', '🏪', '🌍']
  },
  {
    name: 'Nature & Qualité',
    icons: ['🌿', '♻️', '🍃', '🌱', '💧', '☀️', '❄️', '🔥', '🌈', '🌊', '🏔', '🌸', '🍀', '🌻', '🐝', '🦋', '🌾', '🎋', '🍂', '🌙']
  },
  {
    name: 'Alimentation',
    icons: ['🍎', '🥩', '🧀', '🥖', '🍕', '☕', '🍷', '🥤', '🧁', '🍫', '🥗', '🌶', '🧄', '🫒', '🍯', '🥚', '🐟', '🥜', '🌽', '🍇']
  }
];

/* ── Helper: detect if a string is SVG ──────────────────── */
function isSvgString(str) {
  if (!str) return false;
  const trimmed = str.trim();
  return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml');
}

/* ── Helper: sanitise SVG (basic — strip script tags) ───── */
function sanitiseSvg(raw) {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .trim();
}

/* ── Render an icon value (emoji string or SVG markup) ──── */
export function renderBadgeIcon(icon, sizePx = 20) {
  if (!icon) return null;
  if (isSvgString(icon)) {
    // Inject width/height into the SVG root
    let svg = icon;
    if (!svg.includes('width=')) {
      svg = svg.replace('<svg', `<svg width="${sizePx}" height="${sizePx}"`);
    } else {
      svg = svg.replace(/width\s*=\s*["'][^"']*["']/, `width="${sizePx}"`);
      svg = svg.replace(/height\s*=\s*["'][^"']*["']/, `height="${sizePx}"`);
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: `${sizePx}px`,
          height: `${sizePx}px`,
          flexShrink: 0,
          lineHeight: 1
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  // Emoji / text
  return (
    <span
      style={{
        fontSize: `${sizePx}px`,
        lineHeight: 1,
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {icon}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   IconPicker — drop-in icon chooser
   Props:
     value       current icon string (emoji or SVG)
     onChange     (newValue: string) => void
   ══════════════════════════════════════════════════════════ */
export default function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('emoji');  // 'emoji' | 'custom'
  const [search, setSearch] = useState('');
  const [svgInput, setSvgInput] = useState('');
  const fileRef = useRef(null);

  /* Filter emojis by category name search */
  const filteredCategories = search
    ? ICON_CATEGORIES.map(cat => ({
        ...cat,
        icons: cat.icons.filter(() =>
          cat.name.toLowerCase().includes(search.toLowerCase())
        )
      })).filter(cat => cat.icons.length > 0)
    : ICON_CATEGORIES;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.svg')) {
      alert('Seuls les fichiers .svg sont acceptés');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result;
      if (typeof raw === 'string') {
        const clean = sanitiseSvg(raw);
        onChange(clean);
        setSvgInput(clean);
      }
    };
    reader.readAsText(file);
  };

  const applySvgPaste = () => {
    const trimmed = svgInput.trim();
    if (!trimmed) return;
    if (isSvgString(trimmed)) {
      onChange(sanitiseSvg(trimmed));
    } else {
      // Treat as emoji / text
      onChange(trimmed);
    }
  };

  const previewSize = 28;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Trigger button — shows current icon */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          height: '40px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          background: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '4px'
        }}
        title="Choisir une icône"
      >
        {value ? (
          renderBadgeIcon(value, previewSize)
        ) : (
          <span style={{ color: '#9ca3af', fontSize: '12px' }}>Icône</span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '44px',
              left: 0,
              zIndex: 1000,
              width: '340px',
              maxHeight: '420px',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              {[
                { key: 'emoji', label: '😀 Émojis' },
                { key: 'custom', label: '✏️ Personnalisé' }
              ].map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    fontSize: '13px',
                    fontWeight: tab === t.key ? 700 : 500,
                    color: tab === t.key ? '#e48125' : '#6b7280',
                    background: tab === t.key ? '#fef9f0' : 'transparent',
                    border: 'none',
                    borderBottom: tab === t.key ? '2px solid #e48125' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Emoji tab ── */}
            {tab === 'emoji' && (
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                {/* Search */}
                <div style={{ padding: '8px 10px', flexShrink: 0 }}>
                  <input
                    type="text"
                    placeholder="Rechercher une catégorie..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Categories + icons */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '0 10px 10px' }}>
                  {filteredCategories.map(cat => (
                    <div key={cat.name} style={{ marginBottom: '10px' }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {cat.name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                        {cat.icons.map(icon => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => {
                              onChange(icon);
                              setOpen(false);
                            }}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              border: value === icon ? '2px solid #e48125' : '1px solid transparent',
                              borderRadius: '6px',
                              background: value === icon ? '#fef3c7' : 'transparent',
                              cursor: 'pointer',
                              lineHeight: 1,
                              transition: 'background 0.1s'
                            }}
                            title={icon}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredCategories.length === 0 && (
                    <div style={{ color: '#9ca3af', fontSize: '12px', padding: '12px 0', textAlign: 'center' }}>
                      Aucun résultat
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Custom tab (SVG paste / upload / text) ── */}
            {tab === 'custom' && (
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {/* Text / emoji input */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                    Texte ou émoji
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Ex: ⚡ ou XR"
                      value={!isSvgString(value) ? (value || '') : ''}
                      onChange={(e) => onChange(e.target.value)}
                      style={{
                        flex: 1,
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '16px',
                        textAlign: 'center'
                      }}
                      maxLength={8}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>ou</span>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                </div>

                {/* SVG paste */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                    Coller du code SVG
                  </label>
                  <textarea
                    rows={4}
                    placeholder={'<svg viewBox="0 0 24 24">...</svg>'}
                    value={svgInput}
                    onChange={(e) => setSvgInput(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      applySvgPaste();
                      setOpen(false);
                    }}
                    disabled={!svgInput.trim()}
                    style={{
                      marginTop: '6px',
                      width: '100%',
                      padding: '7px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid #e48125',
                      borderRadius: '6px',
                      background: svgInput.trim() ? '#e48125' : '#f3f4f6',
                      color: svgInput.trim() ? '#fff' : '#9ca3af',
                      cursor: svgInput.trim() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Appliquer le SVG
                  </button>
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>ou</span>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                </div>

                {/* File upload */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                    Importer un fichier SVG
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".svg"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      background: '#fafafa',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#6b7280',
                      textAlign: 'center'
                    }}
                  >
                    📂 Parcourir un fichier .svg
                  </button>
                </div>

                {/* Preview */}
                {value && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '11px', color: '#6b7280', flexShrink: 0 }}>Aperçu :</span>
                    {renderBadgeIcon(value, 24)}
                    <button
                      type="button"
                      onClick={() => { onChange(''); setSvgInput(''); }}
                      style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px 4px'
                      }}
                      title="Effacer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
