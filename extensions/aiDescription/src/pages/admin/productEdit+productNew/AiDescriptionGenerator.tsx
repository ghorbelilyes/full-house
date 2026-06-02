import { Button } from '@components/common/ui/Button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React, { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useModuleEnabled } from '@components/common/modules/ModuleGate.js';
import './AiDescriptionGenerator.scss';

// ── Types ──

interface AiResponseData {
  name: string;
  short_description: string;
  url_key: string;
  meta_title: string;
  meta_description: string;
  description: any[];
  downloaded_images: string[];
  source_data: {
    original_title: string;
    original_url: string;
    specs_found: boolean;
    videos_found: boolean;
    images_count: number;
    brand: string;
    sku: string;
  };
}

// ── Component ──

export default function AiDescriptionGenerator() {
  if (!useModuleEnabled('aiProductDescriptions')) return null;
  const { setValue, getValues } = useFormContext();

  const [url, setUrl] = useState('');
  const [tone, setTone] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResponseData | null>(null);
  const [inserted, setInserted] = useState<Record<string, boolean>>({});
  const [showOptions, setShowOptions] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!url.trim()) {
      setError('Veuillez entrer une URL.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setInserted({});

    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          url: url.trim(),
          tone: tone || undefined,
          category: category || undefined,
          notes: notes || undefined
        })
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.message || 'Erreur lors de la génération.');
        return;
      }

      setResult(json.data);
    } catch (err: any) {
      setError(err.message || 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }, [url, tone, category, notes]);

  const insertField = useCallback(
    (fieldName: string, value: any) => {
      setValue(fieldName, value, { shouldDirty: true, shouldValidate: true });
      setInserted((prev) => ({ ...prev, [fieldName]: true }));
    },
    [setValue]
  );

  const insertDescription = useCallback(() => {
    if (!result) return;

    // Get existing description rows
    const existingDesc = getValues('description');
    const existingRows = Array.isArray(existingDesc) ? existingDesc : [];

    // Append AI-generated rows after existing ones
    const newRows = [...existingRows, ...result.description];
    setValue('description', newRows, { shouldDirty: true });
    setInserted((prev) => ({ ...prev, description: true }));
  }, [result, getValues, setValue]);

  const insertAll = useCallback(() => {
    if (!result) return;
    insertField('name', result.name);
    insertField('url_key', result.url_key);
    insertField('meta_title', result.meta_title);
    insertField('meta_description', result.meta_description);
    insertDescription();
  }, [result, insertField, insertDescription]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Générateur IA de Description
          </span>
        </CardTitle>
        <CardDescription>
          Collez un lien fournisseur pour générer automatiquement une fiche produit professionnelle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="ai-gen flex flex-col gap-4">
          {/* URL Input */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">
                URL du produit source
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://fournisseur.com/produit..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {/* Toggle options */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: showOptions ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Options avancées
          </button>

          {showOptions && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-md border border-border bg-muted/30">
              <div>
                <label className="text-sm font-medium mb-1 block">Ton</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="">Paramètre par défaut</option>
                  <option value="professionnel">Professionnel</option>
                  <option value="luxe">Luxe / Premium</option>
                  <option value="convivial">Convivial / Familial</option>
                  <option value="technique">Technique / Expert</option>
                  <option value="jeune">Jeune / Dynamique</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Catégorie (optionnel)
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Électroménager"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  disabled={loading}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">
                  Notes supplémentaires (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions spéciales pour l'IA..."
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Generate button */}
          <Button
            variant="default"
            onClick={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Génération en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Générer avec l'IA
              </span>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <strong>Erreur :</strong> {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="ai-gen__results border border-border rounded-lg overflow-hidden">
              {/* Header with Insert All button */}
              <div className="flex items-center justify-between p-3 bg-green-50 border-b border-border">
                <span className="text-sm font-semibold text-green-800 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Contenu généré avec succès
                </span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    insertAll();
                  }}
                >
                  Tout insérer
                </Button>
              </div>

              {/* Source info */}
              <div className="p-3 bg-muted/30 border-b border-border text-xs text-muted-foreground">
                Source : {result.source_data.original_title} |{' '}
                {result.source_data.images_count} images
                {result.source_data.specs_found && ' | Specs ✓'}
                {result.source_data.videos_found && ' | Vidéo ✓'}
                {result.source_data.brand && ` | ${result.source_data.brand}`}
              </div>

              {/* Individual fields */}
              <div className="p-3 space-y-3">
                <FieldPreview
                  label="Nom du produit"
                  value={result.name}
                  fieldName="name"
                  onInsert={insertField}
                  inserted={!!inserted['name']}
                />
                <FieldPreview
                  label="Clé URL"
                  value={result.url_key}
                  fieldName="url_key"
                  onInsert={insertField}
                  inserted={!!inserted['url_key']}
                />
                <FieldPreview
                  label="Méta titre"
                  value={result.meta_title}
                  fieldName="meta_title"
                  onInsert={insertField}
                  inserted={!!inserted['meta_title']}
                />
                <FieldPreview
                  label="Méta description"
                  value={result.meta_description}
                  fieldName="meta_description"
                  onInsert={insertField}
                  inserted={!!inserted['meta_description']}
                />

                {/* Description preview */}
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between p-2 bg-muted/50 border-b border-border">
                    <span className="text-sm font-medium">Description produit</span>
                    <Button
                      variant={inserted['description'] ? 'outline' : 'default'}
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        insertDescription();
                      }}
                      disabled={!!inserted['description']}
                    >
                      {inserted['description'] ? '✓ Inséré' : 'Insérer'}
                    </Button>
                  </div>
                  <div className="p-3 text-sm max-h-[300px] overflow-y-auto ai-desc-preview">
                    <DescriptionPreview rows={result.description} />
                  </div>
                  {inserted['description'] && (
                    <div className="p-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-800">
                      <strong>Note :</strong> La description a été insérée dans le formulaire.
                      Enregistrez le produit pour valider. L'éditeur visuel affichera la description
                      au prochain chargement de la page.
                    </div>
                  )}
                </div>

                {/* Downloaded images */}
                {result.downloaded_images.length > 0 && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <div className="p-2 bg-muted/50 border-b border-border">
                      <span className="text-sm font-medium">
                        Images téléchargées ({result.downloaded_images.length})
                      </span>
                    </div>
                    <div className="p-3 flex gap-2 flex-wrap">
                      {result.downloaded_images.map((path, i) => (
                        <img
                          key={i}
                          src={path}
                          alt={`Image ${i + 1}`}
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Sub-components ──

function FieldPreview({
  label,
  value,
  fieldName,
  onInsert,
  inserted
}: {
  label: string;
  value: string;
  fieldName: string;
  onInsert: (field: string, value: any) => void;
  inserted: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 p-2 rounded border border-border bg-muted/20">
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <p className="text-sm mt-0.5 break-words">{value}</p>
      </div>
      <Button
        variant={inserted ? 'outline' : 'secondary'}
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          onInsert(fieldName, value);
        }}
        disabled={inserted}
        style={{ flexShrink: 0 }}
      >
        {inserted ? '✓' : 'Insérer'}
      </Button>
    </div>
  );
}

/**
 * Simple read-only preview of EditorJS Row[] structure.
 * This renders a static approximation of what the storefront will show.
 */
function DescriptionPreview({ rows }: { rows: any[] }) {
  if (!rows || rows.length === 0) {
    return <p className="text-muted-foreground italic">Aucun contenu</p>;
  }

  return (
    <div className="prose prose-sm max-w-none">
      {rows.map((row, ri) => (
        <div key={ri} className="mb-4">
          {row.columns?.map((col: any, ci: number) => (
            <div key={ci}>
              {col.data?.blocks?.map((block: any, bi: number) => {
                switch (block.type) {
                  case 'header':
                    return React.createElement(
                      `h${block.data.level || 2}`,
                      { key: bi, className: 'font-bold mt-3 mb-1' },
                      block.data.text
                    );
                  case 'paragraph':
                    return (
                      <p
                        key={bi}
                        dangerouslySetInnerHTML={{ __html: block.data.text }}
                      />
                    );
                  case 'list':
                    return (
                      <ul key={bi} className="list-disc pl-5">
                        {block.data.items?.map((item: string, ii: number) => (
                          <li key={ii}>{item}</li>
                        ))}
                      </ul>
                    );
                  case 'image':
                    return (
                      <img
                        key={bi}
                        src={block.data.file?.url}
                        alt={block.data.caption || ''}
                        style={{
                          maxWidth: '200px',
                          borderRadius: '8px',
                          margin: '8px 0'
                        }}
                      />
                    );
                  case 'raw':
                    return (
                      <div
                        key={bi}
                        className="border rounded p-2 bg-muted/30 text-xs overflow-auto"
                        dangerouslySetInnerHTML={{ __html: block.data.html }}
                      />
                    );
                  case 'quote':
                    return (
                      <blockquote
                        key={bi}
                        className="border-l-4 border-border pl-3 italic"
                      >
                        {block.data.text}
                      </blockquote>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 25
};
