import React from 'react';
import { useOptionalWishlist } from '@components/frontStore/wishlist/WishlistContext.js';
import { Heart } from 'lucide-react';

interface WishlistIconProps {
  wishlistUrl: string;
}

export default function WishlistIcon({ wishlistUrl }: WishlistIconProps) {
  const wishlist = useOptionalWishlist();
  const count = wishlist?.productIds?.length || 0;

  return (
    <a
      href={wishlistUrl}
      className="wishlist-header-icon"
      title={`Favoris${count > 0 ? ` (${count})` : ''}`}
      aria-label={`Favoris${count > 0 ? `, ${count} produit${count > 1 ? 's' : ''}` : ''}`}
    >
      <Heart className="wishlist-header-icon__svg" />
      {count > 0 && (
        <span className="wishlist-header-icon__badge">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </a>
  );
}

export const layout = {
  areaId: 'headerActions',
  sortOrder: 15
};

export const query = `
  query Query {
    wishlistUrl: url(routeId: "wishlistPage")
  }
`;
