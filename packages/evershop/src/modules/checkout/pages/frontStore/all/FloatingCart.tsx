import {
  useCartState,
  CartSyncTrigger
} from '@components/frontStore/cart/CartContext.js';
import { MiniCart } from '@components/frontStore/cart/MiniCart.js';
import { ShoppingCart } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

function FloatingCartIcon({
  totalQty,
  onClick,
  syncStatus
}: {
  totalQty: number;
  onClick: () => void;
  isOpen: boolean;
  disabled?: boolean;
  showItemCount?: boolean;
  syncStatus: { syncing: boolean };
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 hidden h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:bg-brand-strong hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer md:flex"
      aria-label={`Panier — ${totalQty} articles`}
    >
      {syncStatus.syncing ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <ShoppingCart className="h-6 w-6" />
      )}
      {totalQty > 0 && !syncStatus.syncing && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white ring-2 ring-white">
          {totalQty > 99 ? '99+' : totalQty}
        </span>
      )}
    </button>
  );
}

export default function FloatingCart({ cartUrl }: { cartUrl: string }) {
  return (
    <MiniCart
      className=""
      cartUrl={cartUrl}
      autoOpenOnAdd={false}
      CartIconComponent={FloatingCartIcon}
    />
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 999
};

export const query = `
  query Query {
    cartUrl: url(routeId: "cart"),
  }
`;
