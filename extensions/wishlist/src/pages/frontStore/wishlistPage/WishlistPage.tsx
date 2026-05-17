import React from 'react';
import { useOptionalWishlist } from '@components/frontStore/wishlist/WishlistContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';

interface WishlistItem {
  wishlistItemId: number;
  uuid: string;
  productId: number;
  productSku: string | null;
  productName: string | null;
  thumbnail: string | null;
  productUrl: string | null;
  removeApi: string;
  createdAt: string | null;
}

interface WishlistPageProps {
  myWishlist: {
    items: WishlistItem[];
    toggleItemApi: string;
  } | null;
  addMineCartItemApi: string;
}

export default function WishlistPage({
  myWishlist,
  addMineCartItemApi
}: WishlistPageProps) {
  const items = myWishlist?.items || [];
  const [removingId, setRemovingId] = React.useState<number | null>(null);
  const [addingToCartId, setAddingToCartId] = React.useState<number | null>(
    null
  );
  const [localItems, setLocalItems] = React.useState(items);

  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const wishlistCtx = useOptionalWishlist();

  const handleRemove = async (item: WishlistItem) => {
    setRemovingId(item.productId);
    try {
      const res = await fetch(item.removeApi, { method: 'DELETE' });
      if (res.ok) {
        setLocalItems((prev) =>
          prev.filter((i) => i.productId !== item.productId)
        );
        wishlistCtx?.removeItem(item.productId);
      }
    } catch {
      // ignore
    }
    setRemovingId(null);
  };

  const handleAddToCart = async (item: WishlistItem) => {
    if (!item.productSku) return;
    setAddingToCartId(item.productId);
    try {
      const res = await fetch(addMineCartItemApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: item.productSku, qty: 1 })
      });
      if (res.ok) {
        // Reload to refresh cart count in header
        window.location.reload();
      }
    } catch {
      // ignore
    }
    setAddingToCartId(null);
  };

  return (
    <div className="page-width mt-8 mb-16">
      {/* Page heading */}
      <div className="flex items-center gap-3 mb-8">
        <svg
          className="h-7 w-7 text-rose-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {_('My Favorites')}
        </h1>
        {localItems.length > 0 && (
          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-sm font-semibold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
            {localItems.length}
          </span>
        )}
      </div>

      {/* Empty state */}
      {localItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            className="h-20 w-20 text-slate-300 dark:text-slate-600 mb-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-2">
            {_('Your favorites are empty')}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-md">
            {_(
              'Browse our products and click the heart icon to save your favorites here.'
            )}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.97]"
          >
            {_('Discover our products')}
          </a>
        </div>
      )}

      {/* Items grid */}
      {localItems.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {localItems.map((item) => (
            <div
              key={item.wishlistItemId}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                disabled={removingId === item.productId}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm backdrop-blur-sm transition-all hover:bg-rose-50 hover:scale-110 active:scale-95 dark:bg-slate-800/90 dark:hover:bg-slate-700 disabled:opacity-50"
                title={_('Remove from favorites')}
              >
                {removingId === item.productId ? (
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>

              {/* Image */}
              <a
                href={item.productUrl || '#'}
                className="block aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.productName || ''}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg
                      className="h-12 w-12 text-slate-300 dark:text-slate-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </a>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <a
                  href={item.productUrl || '#'}
                  className="text-sm font-semibold text-slate-800 line-clamp-2 hover:text-orange-600 transition-colors dark:text-slate-100 dark:hover:text-orange-400"
                >
                  {item.productName || item.productSku}
                </a>
                {item.productSku && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    SKU: {item.productSku}
                  </span>
                )}

                {/* Add to cart button */}
                <button
                  type="button"
                  onClick={() => handleAddToCart(item)}
                  disabled={addingToCartId === item.productId}
                  className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.97] disabled:opacity-60"
                >
                  {addingToCartId === item.productId ? (
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                      />
                    </svg>
                  )}
                  {_('Add to cart')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    myWishlist {
      items {
        wishlistItemId
        uuid
        productId
        productSku
        productName
        thumbnail
        productUrl
        removeApi
        createdAt
      }
      toggleItemApi
    }
    addMineCartItemApi: url(routeId: "addMineCartItem")
  }
`;
