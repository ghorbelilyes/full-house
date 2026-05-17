import { NumberField } from '@components/common/form/NumberField.js';
import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

interface InventoryHistoryEntry {
  historyId: number;
  actionType: string;
  actionLabel: string;
  qtyBefore: number;
  qtyChange: number;
  qtyAfter: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  adminUser: string | null;
  createdAt: string;
}

interface InventoryProps {
  product:
    | {
        uuid: string;
        inventory: {
          qty: number;
          stockAvailability: number;
          manageStock: number;
          history: InventoryHistoryEntry[];
        };
      }
    | undefined;
  adjustStockUrl: string;
}

const ACTION_ICONS: Record<string, string> = {
  initial_stock: '🏁',
  stock_added: '📦',
  stock_removed: '📤',
  stock_adjusted_up: '📈',
  stock_adjusted_down: '📉',
  order_placed: '🛒',
  order_canceled: '↩️',
  admin_edit: '✏️'
};

const ACTION_COLORS: Record<string, string> = {
  initial_stock: 'text-blue-600 dark:text-blue-400',
  stock_added: 'text-green-600 dark:text-green-400',
  stock_removed: 'text-red-600 dark:text-red-400',
  stock_adjusted_up: 'text-green-600 dark:text-green-400',
  stock_adjusted_down: 'text-red-600 dark:text-red-400',
  order_placed: 'text-orange-600 dark:text-orange-400',
  order_canceled: 'text-purple-600 dark:text-purple-400',
  admin_edit: 'text-gray-600 dark:text-gray-400'
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

function StockAdjustmentForm({
  adjustStockUrl,
  currentQty,
  onAdjusted
}: {
  adjustStockUrl: string;
  currentQty: number;
  onAdjusted: (newQty: number, entry: InventoryHistoryEntry) => void;
}) {
  const [action, setAction] = useState<'add' | 'remove'>('add');
  const [qty, setQty] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (qty <= 0) {
        toast.error('La quantité doit être supérieure à 0');
        return;
      }
      setIsSubmitting(true);
      try {
        const response = await fetch(adjustStockUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qty_change: qty, action, reason })
        });
        const result = await response.json();
        if (result.error) {
          toast.error(result.error.message);
        } else {
          toast.success('Stock mis à jour avec succès');
          const newEntry: InventoryHistoryEntry = {
            historyId: Date.now(),
            actionType: result.data.actionType,
            actionLabel:
              action === 'add' ? 'Ajout de stock' : 'Retrait de stock',
            qtyBefore: result.data.previousQty,
            qtyChange: result.data.change,
            qtyAfter: result.data.qty,
            reason: reason || null,
            referenceType: 'admin_adjustment',
            referenceId: null,
            adminUser: 'admin',
            createdAt: new Date().toISOString()
          };
          onAdjusted(result.data.qty, newEntry);
          setQty(1);
          setReason('');
        }
      } catch (err: any) {
        toast.error(err.message || 'Erreur réseau');
      } finally {
        setIsSubmitting(false);
      }
    },
    [adjustStockUrl, qty, action, reason, onAdjusted]
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAction('add')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
            action === 'add'
              ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
              : 'bg-background border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          + Ajouter
        </button>
        <button
          type="button"
          onClick={() => setAction('remove')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
            action === 'remove'
              ? 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
              : 'bg-background border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          − Retirer
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Quantité
          </label>
          <input
            type="number"
            min="1"
            max={action === 'remove' ? currentQty : undefined}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">
            Nouveau stock
          </label>
          <div className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm font-semibold text-center">
            {action === 'add' ? currentQty + qty : Math.max(currentQty - qty, 0)}
          </div>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Raison (optionnel)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex: Réapprovisionnement fournisseur, Inventaire, Correction..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || qty <= 0}
        className={`w-full py-2 px-4 rounded-md text-sm font-medium text-white transition-colors ${
          action === 'add'
            ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
            : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
        } disabled:cursor-not-allowed`}
      >
        {isSubmitting
          ? 'Mise à jour...'
          : action === 'add'
            ? `Ajouter ${qty} unité${qty > 1 ? 's' : ''}`
            : `Retirer ${qty} unité${qty > 1 ? 's' : ''}`}
      </button>
    </div>
  );
}

function HistoryTable({ history }: { history: InventoryHistoryEntry[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayHistory = showAll ? history : history.slice(0, 5);

  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Aucun historique de stock disponible
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-1 font-medium text-muted-foreground text-xs">
                Date
              </th>
              <th className="text-left py-2 px-1 font-medium text-muted-foreground text-xs">
                Action
              </th>
              <th className="text-right py-2 px-1 font-medium text-muted-foreground text-xs">
                Variation
              </th>
              <th className="text-right py-2 px-1 font-medium text-muted-foreground text-xs">
                Stock
              </th>
              <th className="text-left py-2 px-1 font-medium text-muted-foreground text-xs">
                Raison
              </th>
            </tr>
          </thead>
          <tbody>
            {displayHistory.map((entry) => (
              <tr
                key={entry.historyId}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-1.5 px-1 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(entry.createdAt)}
                </td>
                <td className="py-1.5 px-1">
                  <span className="flex items-center gap-1 text-xs">
                    <span>{ACTION_ICONS[entry.actionType] || '📋'}</span>
                    <span
                      className={
                        ACTION_COLORS[entry.actionType] || 'text-foreground'
                      }
                    >
                      {entry.actionLabel}
                    </span>
                  </span>
                </td>
                <td className="py-1.5 px-1 text-right">
                  <span
                    className={`text-xs font-mono font-semibold ${
                      entry.qtyChange > 0
                        ? 'text-green-600 dark:text-green-400'
                        : entry.qtyChange < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {entry.qtyChange > 0 ? '+' : ''}
                    {entry.qtyChange}
                  </span>
                </td>
                <td className="py-1.5 px-1 text-right text-xs font-mono">
                  {entry.qtyAfter}
                </td>
                <td className="py-1.5 px-1 text-xs text-muted-foreground max-w-[120px] truncate">
                  {entry.reason || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {history.length > 5 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary hover:underline w-full text-center py-1"
        >
          {showAll
            ? 'Afficher moins'
            : `Afficher tout (${history.length} entrées)`}
        </button>
      )}
    </div>
  );
}

export default function Inventory({ product, adjustStockUrl }: InventoryProps) {
  const inventory = product?.inventory || {
    qty: 0,
    stockAvailability: undefined,
    manageStock: undefined,
    history: []
  };

  const isNew = !product?.uuid;
  const [currentQty, setCurrentQty] = useState(inventory.qty || 0);
  const [history, setHistory] = useState<InventoryHistoryEntry[]>(
    inventory.history || []
  );

  const handleAdjusted = useCallback(
    (newQty: number, entry: InventoryHistoryEntry) => {
      setCurrentQty(newQty);
      setHistory((prev) => [entry, ...prev]);
    },
    []
  );

  return (
    <Card className="bg-popover">
      <CardHeader>
        <CardTitle>Inventaire</CardTitle>
        <CardDescription>
          Gérer les paramètres d'inventaire du produit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroupField
          name="manage_stock"
          label="Gérer le Stock"
          options={[
            { value: 1, label: 'Oui' },
            { value: 0, label: 'Non' }
          ]}
          defaultValue={inventory.manageStock === 0 ? 0 : 1}
          required
        />
      </CardContent>
      <CardContent className="border-t border-t-border pt-6">
        <RadioGroupField
          name="stock_availability"
          label="Disponibilité en Stock"
          options={[
            { value: 1, label: 'En Stock' },
            { value: 0, label: 'Rupture de Stock' }
          ]}
          defaultValue={inventory.stockAvailability === 0 ? 0 : 1}
          required
        />
      </CardContent>
      <CardContent className="border-t border-t-border pt-6">
        {isNew ? (
          /* For new products, show a simple qty input */
          <NumberField
            name="qty"
            defaultValue={inventory.qty}
            placeholder="Quantité"
            label="Quantité initiale"
            required
          />
        ) : (
          /* For existing products, show current stock + adjustment controls */
          <div className="space-y-4">
            {/* Current stock display */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Stock actuel
              </label>
              <div className="flex items-center gap-3">
                <div
                  className={`text-3xl font-bold tabular-nums ${
                    currentQty <= 0
                      ? 'text-red-600 dark:text-red-400'
                      : currentQty <= 5
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {currentQty}
                </div>
                <span className="text-sm text-muted-foreground">
                  unité{currentQty !== 1 ? 's' : ''}
                </span>
                {currentQty <= 0 && (
                  <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                    Rupture
                  </span>
                )}
                {currentQty > 0 && currentQty <= 5 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    Stock faible
                  </span>
                )}
              </div>
            </div>

            {/* Hidden input to keep the form qty value in sync */}
            <input type="hidden" name="qty" value={currentQty} />

            {/* Stock adjustment form */}
            <div className="border border-border rounded-lg p-3 bg-background">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Ajuster le stock
              </h4>
              <StockAdjustmentForm
                adjustStockUrl={adjustStockUrl}
                currentQty={currentQty}
                onAdjusted={handleAdjusted}
              />
            </div>
          </div>
        )}
      </CardContent>
      {!isNew && history.length > 0 && (
        <CardContent className="border-t border-t-border pt-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Historique des mouvements
          </h4>
          <HistoryTable history={history} />
        </CardContent>
      )}
    </Card>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 15
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      uuid
      inventory {
        qty
        stockAvailability
        manageStock
        history {
          historyId
          actionType
          actionLabel
          qtyBefore
          qtyChange
          qtyAfter
          reason
          referenceType
          referenceId
          adminUser
          createdAt
        }
      }
    }
    adjustStockUrl: url(routeId: "adjustStock", params: [{key: "id", value: getContextValue("productUuid", "_")}])
  }
`;
