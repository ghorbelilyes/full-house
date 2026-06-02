import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useOptionalWishlist } from '@components/frontStore/wishlist/WishlistContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';

interface WishlistButtonProps {
  product: {
    productId: number;
  };
}

function HeartButton({
  onClick,
  loading,
  inWishlist,
  animating,
  className
}: {
  onClick: () => void;
  loading: boolean;
  inWishlist: boolean;
  animating: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={inWishlist ? _('In favorites') : _('Add to favorites')}
      className={`pdp-heart-btn ${inWishlist ? 'pdp-heart-btn--active' : ''} ${className || ''}`}
    >
      {loading ? (
        <svg className="pdp-heart-icon animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <svg
          className={`pdp-heart-icon ${animating ? 'pdp-heart-animate' : ''}`}
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
    </button>
  );
}

export default function WishlistButton({ product }: WishlistButtonProps) {
  const productId = product?.productId;
  const wishlistCtx = useOptionalWishlist();
  const [animating, setAnimating] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [mobileContainer, setMobileContainer] = useState<HTMLElement | null>(null);

  const inWishlist = wishlistCtx?.isInWishlist(productId) ?? false;
  const loading = localLoading || (wishlistCtx?.loading ?? false);

  useEffect(() => {
    // Find the gallery container (.pdp-left) and attach a portal target
    const left = document.querySelector('.pdp-left');
    if (left) {
      // Make sure left is position: relative for the absolute heart
      (left as HTMLElement).style.position = 'relative';
      let target = left.querySelector('.pdp-mobile-heart-portal') as HTMLElement;
      if (!target) {
        target = document.createElement('div');
        target.className = 'pdp-mobile-heart-portal';
        left.appendChild(target);
      }
      setMobileContainer(target);
    }
  }, []);

  const handleToggle = async () => {
    if (!productId || loading || !wishlistCtx) return;
    setLocalLoading(true);
    try {
      const added = await wishlistCtx.toggleItem(productId);
      if (added) {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 600);
      }
    } catch {
      // ignore
    }
    setLocalLoading(false);
  };

  return (
    <>
      {/* Desktop: absolute top-right of right column */}
      <div className="pdp-wishlist-desktop">
        <HeartButton
          onClick={handleToggle}
          loading={loading}
          inWishlist={inWishlist}
          animating={animating}
        />
      </div>

      {/* Mobile: portal into gallery (.pdp-left) */}
      {mobileContainer &&
        ReactDOM.createPortal(
          <HeartButton
            onClick={handleToggle}
            loading={loading}
            inWishlist={inWishlist}
            animating={animating}
          />,
          mobileContainer
        )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
.pdp-heart-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: #ffe3e8; border: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #ff4d6d; cursor: pointer; transition: all 0.2s;
}
.pdp-heart-btn:hover { transform: scale(1.1); }
.pdp-heart-btn:active { transform: scale(0.9); }
.pdp-heart-btn--active { background: #ff4d6d; color: #fff; }
.pdp-heart-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.pdp-heart-icon { width: 18px; height: 18px; }
.pdp-heart-animate { animation: pdpHeartPop 0.4s ease; }
@keyframes pdpHeartPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* Desktop: top-right corner of right column */
.pdp-wishlist-desktop {
  position: absolute; top: 0; right: 0; z-index: 10;
}
/* Mobile portal target */
.pdp-mobile-heart-portal {
  display: none;
}

@media (max-width: 900px) {
  .pdp-wishlist-desktop { display: none; }
  .pdp-mobile-heart-portal {
    display: block;
    position: absolute;
    top: 14px; right: 14px; z-index: 10;
  }
}
`
        }}
      />
    </>
  );
}

export const layout = {
  areaId: 'productPageMiddleRight',
  sortOrder: 1
};

export const query = `
  query Query {
    product: currentProduct {
      productId
    }
  }
`;
