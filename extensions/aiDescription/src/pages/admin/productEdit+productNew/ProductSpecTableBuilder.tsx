import { Button } from '@components/common/ui/Button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React, { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import './AiDescriptionGenerator.scss';

type SpecRow = {
  id: string;
  key: string;
  value: string;
};

function makeId(prefix: string): string {
  return `${prefix}__${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function blockId(): string {
  return Math.random().toString(36).slice(2, 12).padEnd(10, '0');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildSpecTableHtml(rows: SpecRow[]): string {
  const body = rows
    .filter((row) => row.key.trim() && row.value.trim())
    .map(
      (row) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap">${escapeHtml(row.key.trim())}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563">${escapeHtml(row.value.trim())}</td></tr>`
    )
    .join('');

  return `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><tbody>${body}</tbody></table>`;
}

function makeRawHtmlRow(html: string) {
  return {
    id: makeId('r'),
    size: 1,
    columns: [
      {
        id: makeId('c'),
        size: 1,
        data: {
          time: Date.now(),
          version: '2.30.2',
          blocks: [
            {
              id: blockId(),
              type: 'raw',
              data: { html }
            }
          ]
        }
      }
    ]
  };
}

const initialRows: SpecRow[] = [
  { id: makeId('spec'), key: 'Marque', value: '' },
  { id: makeId('spec'), key: 'Référence', value: '' },
  { id: makeId('spec'), key: 'Modèle', value: '' }
];

export default function ProductSpecTableBuilder() {
  const { getValues, setValue } = useFormContext();
  const [rows, setRows] = useState<SpecRow[]>(initialRows);
  const [inserted, setInserted] = useState(false);

  const filledRows = useMemo(
    () => rows.filter((row) => row.key.trim() && row.value.trim()),
    [rows]
  );
  const tableHtml = useMemo(() => buildSpecTableHtml(rows), [rows]);

  const updateRow = (id: string, field: 'key' | 'value', value: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
    setInserted(false);
  };

  const addRow = () => {
    setRows((current) =>
      current.concat({ id: makeId('spec'), key: '', value: '' })
    );
    setInserted(false);
  };

  const removeRow = (id: string) => {
    setRows((current) =>
      current.length > 1 ? current.filter((row) => row.id !== id) : current
    );
    setInserted(false);
  };

  const insertTable = () => {
    if (filledRows.length === 0) return;

    const newRow = makeRawHtmlRow(tableHtml);
    const existingDescription = getValues('description');
    const nextDescription = Array.isArray(existingDescription)
      ? existingDescription.concat(newRow)
      : [newRow];

    setValue('description', nextDescription, {
      shouldDirty: true,
      shouldValidate: true
    });

    window.dispatchEvent(
      new CustomEvent('evershop:editor:append-rows', {
        detail: {
          name: 'description',
          rows: [newRow]
        }
      })
    );

    setInserted(true);
  };

  return (
    <Card className="">
      <CardHeader className="">
        <CardTitle className="">Tableau caractéristiques</CardTitle>
        <CardDescription className="">
          Ajoutez des lignes clé/valeur à insérer dans la description produit.
        </CardDescription>
      </CardHeader>
      <CardContent className="">
        <div className="spec-table-builder">
          <div className="spec-table-builder__rows">
            {rows.map((row, index) => (
              <div className="spec-table-builder__row" key={row.id}>
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) => updateRow(row.id, 'key', e.target.value)}
                  placeholder="Clé"
                  aria-label={`Clé ${index + 1}`}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => updateRow(row.id, 'value', e.target.value)}
                  placeholder="Valeur"
                  aria-label={`Valeur ${index + 1}`}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <Button
                  type="button"
                  className=""
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    removeRow(row.id);
                  }}
                  disabled={rows.length === 1}
                >
                  Supprimer
                </Button>
              </div>
            ))}
          </div>

          <div className="spec-table-builder__actions">
            <Button
              type="button"
              className=""
              variant="secondary"
              size="sm"
              disabled={false}
              onClick={(e) => {
                e.preventDefault();
                addRow();
              }}
            >
              Ajouter une ligne
            </Button>
            <Button
              type="button"
              className=""
              variant={inserted ? 'outline' : 'default'}
              size="sm"
              disabled={filledRows.length === 0}
              onClick={(e) => {
                e.preventDefault();
                insertTable();
              }}
            >
              {inserted ? 'Tableau inséré' : 'Insérer le tableau'}
            </Button>
          </div>

          {filledRows.length > 0 && (
            <div className="spec-table-builder__preview">
              <div
                className="ai-desc-preview"
                dangerouslySetInnerHTML={{ __html: tableHtml }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 24
};
