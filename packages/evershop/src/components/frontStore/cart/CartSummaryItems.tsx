import { Image } from '@components/common/Image.js';
import { ProductNoThumbnail } from '@components/common/ProductNoThumbnail.js';
import { Skeleton } from '@components/common/ui/Skeleton.js';
import {
  CartItem,
  useCartDispatch,
  useCartState
} from '@components/frontStore/cart/CartContext.js';
import { useItemQuantity } from '@components/frontStore/cart/ItemQuantity.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { Minus, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

const CartSummarySkeleton: React.FC<{ rows?: number }> = ({ rows = 2 }) => {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center py-6 animate-pulse">
          <div className="relative mr-4">
            <div className="w-16 h-16 bg-muted rounded border border-border p-2 box-border" />
          </div>
          <div className="flex-1 min-w-0 items-start align-top">
            <Skeleton className="h-4 w-3/5 mb-2" />
            <Skeleton className="h-3 w-2/5 mb-1" />
          </div>
          <div className="ml-auto text-right">
            <Skeleton className="h-4 w-16" />
          </div>
        </li>
      ))}
    </ul>
  );
};

/* ── Quantity control for a single cart item ───────────────── */
function MiniCartItemQuantity({ item }: { item: CartItem }) {
  const { quantity, increase, decrease, loading } = useItemQuantity({
    initialValue: item.qty,
    min: 1,
    cartItemId: item.cartItemId,
    debounce: 400
  });

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={loading || quantity <= 1}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          decrease();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label={_('Decrease quantity')}
      >
        <Minus size={14} />
      </button>
      <span className="min-w-[28px] text-center text-sm font-semibold tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        disabled={loading}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          increase();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label={_('Increase quantity')}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

/* ── Delete button for a single cart item ──────────────────── */
function MiniCartItemDelete({ item }: { item: CartItem }) {
  const { removeItem } = useCartDispatch();
  const { loadingStates } = useCartState();
  const isRemoving = loadingStates.removingItem === item.cartItemId;
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    try {
      await removeItem(item.cartItemId);
    } catch {
      // error handled by context
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={isRemoving}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDelete();
          }}
          className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {isRemoving ? _('...') : _('Oui')}
        </button>
        <span className="text-xs text-muted-foreground">/</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirming(false);
          }}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          {_('Non')}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={isRemoving}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(true);
      }}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label={_('Remove item')}
      title={_('Supprimer')}
    >
      <Trash2 size={15} />
    </button>
  );
}

const CartSummaryItemsList: React.FC<{
  items: CartItem[];
  loading: boolean;
  showPriceIncludingTax?: boolean;
  editable?: boolean;
}> = ({ items, loading, showPriceIncludingTax, editable = true }) => {
  if (loading && items.length === 0) {
    return <CartSummarySkeleton rows={2} />;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-base">{_('Your cart is empty')}</p>
        <p className="text-sm mt-2">{_('Add some items to get started')}</p>
      </div>
    );
  }

  return (
    <ul className="item__summary__list divide-y divide-divider mb-3">
      {items.map((item) => (
        <li key={item.uuid} className="flex items-start py-3 gap-3">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0 self-center">
            {item.thumbnail && (
              <Image
                width={100}
                height={100}
                src={item.thumbnail}
                alt={item.productName}
                className="w-16 h-16 object-cover rounded border border-border p-1 box-border"
              />
            )}
            {!item.thumbnail && (
              <ProductNoThumbnail className="w-16 h-16 rounded border border-border p-1 box-border" />
            )}
          </div>

          {/* Name + variants + quantity controls */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm mb-1 leading-snug">
              {item.productName}
            </div>
            {item.variantOptions && item.variantOptions.length > 0 && (
              <div className="space-y-0.5 mb-2">
                {item.variantOptions.map((option) => (
                  <div key={option.attributeCode} className="text-xs">
                    <span>{option.attributeName}</span>:{' '}
                    <span className="text-muted-foreground">
                      {option.optionText}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {editable && (
              <div className="flex items-center gap-2 mt-2">
                <MiniCartItemQuantity item={item} />
                <MiniCartItemDelete item={item} />
              </div>
            )}
            {!editable && (
              <span className="text-xs text-muted-foreground">
                {_('Qty')}: {item.qty}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="ml-auto text-right self-center flex-shrink-0">
            <div className="font-semibold text-sm">
              {showPriceIncludingTax
                ? item.lineTotalInclTax.text
                : item.lineTotal.text}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export { CartSummaryItemsList };
