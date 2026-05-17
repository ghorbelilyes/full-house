import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode
} from 'react';

export interface WishlistContextType {
  productIds: number[];
  loading: boolean;
  toggleItem: (productId: number) => Promise<boolean>;
  removeItem: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

interface WishlistProviderProps {
  children: ReactNode;
  initialProductIds: number[];
  toggleApi: string;
}

export function WishlistProvider({
  children,
  initialProductIds,
  toggleApi
}: WishlistProviderProps) {
  const [productIds, setProductIds] = useState<number[]>(
    initialProductIds || []
  );
  const [loading, setLoading] = useState(false);

  const isInWishlist = useCallback(
    (productId: number) => productIds.includes(productId),
    [productIds]
  );

  const removeItem = useCallback(
    (productId: number) => {
      setProductIds((prev) => prev.filter((id) => id !== productId));
    },
    []
  );

  const toggleItem = useCallback(
    async (productId: number): Promise<boolean> => {
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
          setProductIds((prev) =>
            added
              ? [...prev, productId]
              : prev.filter((id) => id !== productId)
          );
          return added;
        }
        return false;
      } catch {
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toggleApi]
  );

  return (
    <WishlistContext.Provider
      value={{ productIds, loading, toggleItem, removeItem, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
}

export function useOptionalWishlist(): WishlistContextType | undefined {
  return useContext(WishlistContext);
}
