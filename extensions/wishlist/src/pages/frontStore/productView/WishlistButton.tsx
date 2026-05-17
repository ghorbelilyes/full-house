import React, { useState } from 'react';
import { _ } from '@evershop/evershop/lib/locale/translate/_';

interface WishlistButtonProps {
  product: {
    productId: number;
  };
  wishlistProductIds: number[];
  toggleApi: string;
}

export default function WishlistButton({
  product,
  wishlistProductIds,
  toggleApi
}: WishlistButtonProps) {
  const productId = product?.productId;
  const [inWishlist, setInWishlist] = useState(
    (wishlistProductIds || []).includes(productId)
  );
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleToggle = async () => {
    if (!productId || loading) return;
    setLoading(true);
    try {
      const res = await fetch(toggleApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
      });
      const json = await res.json();
      if (res.ok) {
        const added = json.data?.added;
        setInWishlist(added);
        if (added) {
          setAnimating(true);
          setTimeout(() => setAnimating(false), 600);
        }
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`
        group/wish mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl border-2 px-5 py-3
        text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-60
        ${
          inWishlist
            ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30'
            : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-500 dark:hover:text-rose-400'
        }
      `}
    >
      {loading ? (
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <svg
          className={`h-5 w-5 transition-transform ${animating ? 'scale-125' : ''}`}
          viewBox="0 0 24 24"
          fill={inWishlist ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
      {inWishlist ? _('In favorites') : _('Add to favorites')}
    </button>
  );
}

export const layout = {
  areaId: 'productPageMiddleRight',
  sortOrder: 35
};

export const query = `
  query Query($id: Int!) {
    product: product(id: $id) {
      productId
    }
    wishlistProductIds
    toggleApi: url(routeId: "toggleWishlistItem")
  }
`;
