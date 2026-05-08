import { Image } from '@components/common/Image.js';
import { ProductNoThumbnail } from '@components/common/ProductNoThumbnail.js';
import { AddToCart } from '@components/frontStore/cart/AddToCart.js';
import { ProductData } from '@components/frontStore/catalog/ProductContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React, { ReactNode } from 'react';
import { toast } from 'react-toastify';

const hasPromotion = (product: ProductData): boolean => {
  return !!(
    product.price.special &&
    product.price.special.value < product.price.regular.value
  );
};

const getDiscountPercent = (product: ProductData): number => {
  if (!hasPromotion(product)) return 0;
  return Math.round(
    ((product.price.regular.value - product.price.special!.value) /
      product.price.regular.value) *
      100
  );
};

/* ── Diagonal PROMO ribbon (top-right corner) ─────────────── */
function PromoRibbon({ percent }: { percent: number }) {
  return (
    <div
      className="absolute -right-[1px] -top-[1px] z-10 overflow-hidden pointer-events-none"
      style={{ width: 100, height: 100 }}
    >
      <div
        className="flex items-center justify-center bg-red-600 text-center text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md"
        style={{
          position: 'absolute',
          top: 18,
          right: -28,
          width: 140,
          transform: 'rotate(45deg)',
          padding: '5px 0'
        }}
      >
        PROMO -{percent}%
      </div>
    </div>
  );
}

export const ProductListItemRender = ({
  product,
  imageWidth,
  imageHeight,
  layout = 'grid',
  showAddToCart = false,
  customAddToCartRenderer
}: {
  product: ProductData;
  imageWidth?: number;
  imageHeight?: number;
  layout?: 'grid' | 'list';
  showAddToCart?: boolean;
  customAddToCartRenderer?: (product: ProductData) => ReactNode;
}) => {
  const onSale = hasPromotion(product);
  const discountPercent = getDiscountPercent(product);

  /* ── List layout ─────────────────────────────────────────── */
  if (layout === 'list') {
    return (
      <article className="group relative flex gap-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-orange-200">
        {/* Image area with PROMO ribbon */}
        <a
          href={product.url}
          className="relative flex h-40 w-40 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 p-4"
        >
          {onSale && <PromoRibbon percent={discountPercent} />}
          {product.image ? (
            <Image
              src={product.image.url}
              alt={product.image.alt || product.name}
              width={imageWidth || 140}
              height={imageHeight || 140}
              loading="lazy"
              sizes="140px"
              className="max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ProductNoThumbnail width={imageWidth} height={imageHeight} />
          )}
        </a>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-800">
              <a
                href={product.url}
                className="transition-colors hover:text-orange-500"
              >
                {product.name}
              </a>
            </h3>

            <div className="mt-3">
              {onSale ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-extrabold text-red-600">
                    {product.price.special!.text}
                  </span>
                  <span className="text-base font-semibold text-slate-500 line-through decoration-slate-400 decoration-2">
                    {product.price.regular.text}
                  </span>
                </div>
              ) : (
                <span className="text-xl font-extrabold text-slate-800">
                  {product.price.regular.text}
                </span>
              )}
            </div>

            <div className="mt-3">
              {product.inventory.isInStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {_('In Stock')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-500">
                  <span className="size-1.5 rounded-full bg-orange-500" />
                  {_('Out of Stock')}
                </span>
              )}
            </div>
          </div>

          {showAddToCart && (
            <div className="mt-4">
              {customAddToCartRenderer ? (
                customAddToCartRenderer(product)
              ) : (
                <AddToCart
                  product={{
                    sku: product.sku,
                    isInStock: product.inventory.isInStock
                  }}
                  qty={1}
                  onError={(error) => toast.error(error)}
                >
                  {(state, actions) => (
                    <button
                      type="button"
                      disabled={!state.canAddToCart || state.isLoading}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        actions.addToCart();
                      }}
                      className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {state.isLoading
                        ? _('Adding...')
                        : _('Add to Cart')}
                    </button>
                  )}
                </AddToCart>
              )}
            </div>
          )}
        </div>
      </article>
    );
  }

  /* ── Grid layout ─────────────────────────────────────────── */
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-200">
      {/* Out-of-stock overlay */}
      {!product.inventory.isInStock && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center bg-white/60">
          <span className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold uppercase text-white">
            {_('SOLD OUT')}
          </span>
        </div>
      )}

      {/* Image area — PROMO ribbon is INSIDE here */}
      <a
        href={product.url}
        className="relative flex h-64 items-center justify-center bg-slate-50 p-8"
      >
        {onSale && <PromoRibbon percent={discountPercent} />}
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt || product.name}
            width={imageWidth || 300}
            height={imageHeight || 300}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ProductNoThumbnail width={imageWidth} height={imageHeight} />
        )}
      </a>

      {/* Info */}
      <div className="border-t border-slate-100 p-5">
        <h3 className="line-clamp-2 min-h-[44px] text-sm font-bold leading-snug text-slate-800">
          <a
            href={product.url}
            className="transition-colors hover:text-orange-500"
          >
            {product.name}
          </a>
        </h3>

        {/* Price — old price is bigger & bolder now */}
        <div className="mt-3">
          {onSale ? (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-extrabold text-red-600">
                {product.price.special!.text}
              </span>
              <span className="text-base font-semibold text-slate-500 line-through decoration-slate-400 decoration-2">
                {product.price.regular.text}
              </span>
            </div>
          ) : (
            <p className="text-lg font-extrabold text-slate-800">
              {product.price.regular.text}
            </p>
          )}
        </div>

        {/* Stock */}
        <div className="mt-2">
          {product.inventory.isInStock ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {_('In Stock')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-500">
              <span className="size-1.5 rounded-full bg-orange-500" />
              {_('Out of Stock')}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        {showAddToCart && (
          <div className="mt-4">
            {customAddToCartRenderer ? (
              customAddToCartRenderer(product)
            ) : (
              <AddToCart
                product={{
                  sku: product.sku,
                  isInStock: product.inventory.isInStock
                }}
                qty={1}
                onError={(error) => toast.error(error)}
              >
                {(state, actions) => (
                  <button
                    type="button"
                    disabled={!state.canAddToCart || state.isLoading}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      actions.addToCart();
                    }}
                    className="w-full rounded-lg bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {state.isLoading
                      ? _('Adding...')
                      : _('Add to Cart')}
                  </button>
                )}
              </AddToCart>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
