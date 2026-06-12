import Area from '@components/common/Area.js';
import { Media } from '@components/frontStore/catalog/Media.js';
import {
  ProductData,
  ProductProvider
} from '@components/frontStore/catalog/ProductContext.js';
import { ProductSingleAttributes } from '@components/frontStore/catalog/ProductSingleAttributes.js';
import { ProductSingleDescription } from '@components/frontStore/catalog/ProductSingleDescription.js';
import { ProductSingleForm } from '@components/frontStore/catalog/ProductSingleForm.js';
import { ProductSingleName } from '@components/frontStore/catalog/ProductSingleName.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { Star } from 'lucide-react';
import React from 'react';

/* ── Helper: detect SVG string & render icon ────────────── */
function isSvg(str: string) {
  if (!str) return false;
  const t = str.trim();
  return t.startsWith('<svg') || t.startsWith('<?xml');
}

function BadgeIcon({ icon, size }: { icon: string; size: number }) {
  if (!icon) return null;
  if (isSvg(icon)) {
    let svg = icon;
    if (!svg.includes('width=')) {
      svg = svg.replace('<svg', `<svg width="${size}" height="${size}"`);
    } else {
      svg = svg.replace(/width\s*=\s*["'][^"']*["']/, `width="${size}"`);
      svg = svg.replace(/height\s*=\s*["'][^"']*["']/, `height="${size}"`);
    }
    return (
      <span
        className="inline-flex items-center justify-center flex-shrink-0"
        style={{ width: `${size}px`, height: `${size}px`, lineHeight: 1 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center flex-shrink-0"
      style={{
        fontSize: `${size}px`, lineHeight: 1,
        width: `${size}px`, height: `${size}px`
      }}
    >
      {icon}
    </span>
  );
}

/* ── Spec Badges ────────────────────────────────────────── */
function SpecBadges({ specBadges }: { specBadges: any[] }) {
  if (!specBadges || specBadges.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {specBadges.map((badge: any, i: number) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs"
        >
          {badge.icon && (
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary">
              <BadgeIcon icon={badge.icon} size={16} />
            </span>
          )}
          <div className="min-w-0">
            <strong className="block text-xs font-extrabold leading-tight text-slate-800">
              {badge.value}
            </strong>
            <small className="block text-[10px] leading-tight text-slate-500">
              {badge.label}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Trust Badges ───────────────────────────────────────── */
function TrustBadges({ trustBadges }: { trustBadges: any[] }) {
  if (!trustBadges || trustBadges.length === 0) return null;
  return (
    <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {trustBadges.map((badge: any, i: number) => (
        <div
          key={i}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
        >
          <span className="flex-shrink-0 text-lg">
            <BadgeIcon icon={badge.icon} size={20} />
          </span>
          <span className="text-xs font-semibold leading-tight text-slate-800">
            {badge.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Star Rating Summary ────────────────────────────────── */
function RatingSummary({ reviewSummary, sku }: { reviewSummary: any; sku: string }) {
  const avg = reviewSummary?.averageRating || 0;
  const total = reviewSummary?.totalReviews || 0;
  const filledStars = Math.round(avg);

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-px text-amber-500">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className="h-3.5 w-3.5"
            fill={index < filledStars ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
        ))}
      </span>
      <span className="text-[13px] text-slate-500">
        {avg > 0 ? avg.toFixed(1) : '—'} {total} {_('reviews')}
      </span>
      {sku && (
        <>
          <span className="text-slate-300">·</span>
          <span className="text-[13px] text-slate-500">SKU: {sku}</span>
        </>
      )}
    </div>
  );
}

export default function ProductView({ product }: { product: any }) {
  const specBadges = product?.specBadges || [];
  const trustBadges = product?.trustBadges || [];
  const reviewSummary = product?.reviewSummary || null;

  return (
    <ProductProvider product={product}>
      <div className="product__detail pdp-redesign">
        <Area id="productPageTop" className="product__page__top" />
        <div className="product__page__middle page-width">
          {/* ── Main product card ── */}
          <div className="pdp-card grid grid-cols-1 gap-0 overflow-hidden rounded-none border-0 bg-transparent shadow-none md:grid-cols-[0.6fr_1fr] md:gap-8 md:rounded-3xl md:border md:border-slate-200 md:bg-white md:p-7 md:shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
            {/* LEFT: gallery + spec badges */}
            <div className="min-w-0 max-w-full overflow-hidden bg-gradient-to-br from-slate-50 to-white md:rounded-2xl md:bg-transparent">
              <Area
                id="productPageMiddleLeft"
                className="product__detail__left"
                coreComponents={[
                  {
                    component: { default: <Media /> },
                    sortOrder: 0,
                    id: 'media'
                  }
                ]}
              />
              {/* Desktop: spec badges under gallery */}
              <div className="hidden md:block">
                <SpecBadges specBadges={specBadges} />
              </div>
            </div>

            {/* RIGHT: product info */}
            <div className="relative min-w-0 px-4 pb-[120px] pt-4 md:px-0 md:pb-0 md:pt-0">
              <Area
                id="productPageMiddleRight"
                className="product__detail__right"
                coreComponents={[
                  {
                    component: {
                      default: (
                        <>
                          <ProductSingleName />
                          <RatingSummary
                            reviewSummary={reviewSummary}
                            sku={product?.sku || ''}
                          />
                          {/* Mobile: spec badges after rating */}
                          <div className="block md:hidden">
                            <SpecBadges specBadges={specBadges} />
                          </div>
                        </>
                      )
                    },
                    sortOrder: 10,
                    id: 'nameAndRating'
                  },
                  {
                    component: { default: <ProductSingleForm /> },
                    sortOrder: 30,
                    id: 'productForm'
                  },
                  {
                    component: {
                      default: <ProductSingleAttributes />
                    },
                    sortOrder: 35,
                    id: 'attributes'
                  },
                  {
                    component: {
                      default: <TrustBadges trustBadges={trustBadges} />
                    },
                    sortOrder: 40,
                    id: 'trustBadges'
                  }
                ]}
              />
            </div>
          </div>

          {/* ── Description ── */}
          <Area
            id="productSingleDescription"
            coreComponents={[
              {
                component: { default: <ProductSingleDescription /> },
                sortOrder: 10,
                id: 'productSingleDescription'
              }
            ]}
          />
        </div>
        <Area id="productPageBottom" className="product__page__bottom" />
      </div>

      {/* ── Mobile sticky bottom CTA ── */}
      <div className="pdp-mobile-cta" id="pdpMobileCta">
        <Area id="pdpMobileCtaButtons" noOuter />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
/* PDP Redesign: product name */
.pdp-redesign .product__single__name {
  font-size: 21px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 6px;
  color: var(--card-foreground, #0f172a);
  padding-right: 50px;
}

/* PDP Redesign: attributes (specs table) */
.pdp-redesign .product__single__attributes {
  padding: 0;
  margin-top: 10px;
}
.pdp-redesign .product__single__attributes ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.pdp-redesign .product__single__attributes li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 11px 0;
  border-bottom: 1px solid var(--border, #f0f0f0);
  font-size: 14px;
  gap: 16px;
}
.pdp-redesign .product__single__attributes li:last-child {
  border-bottom: none;
}
.pdp-redesign .product__single__attributes li strong {
  color: var(--muted-foreground, #94a3b8);
  font-weight: 400;
  white-space: nowrap;
  flex-shrink: 0;
}
.pdp-redesign .product__single__attributes li span {
  color: var(--card-foreground, #1e293b);
  font-weight: 600;
  text-align: right;
}

/* Mobile Sticky CTA */
.pdp-mobile-cta {
  display: none;
}

@media (max-width: 900px) {
  .pdp-redesign .product__single__name {
    font-size: 18px;
    padding-right: 0;
  }

  .pdp-mobile-cta {
    display: flex;
    position: fixed;
    left: 0; right: 0; bottom: 60px;
    background: var(--card, #fff);
    border-top: 1px solid var(--border, #e9edf2);
    padding: 10px 16px;
    gap: 10px;
    z-index: 35;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.06);
  }
}
`
        }}
      />
    </ProductProvider>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
query Query {
    product: currentProduct {
      productId
      name
      description
      sku
      price {
        regular {
          value
          text
        }
        special {
          value
          text
        }
      }
      promotion {
        promotionType
        promotionValue
        promotionLabel
        isActive
        discountPercent
        startDate
        endDate
        savedAmount {
          value
          text
        }
        originalPrice {
          value
          text
        }
        finalPrice {
          value
          text
        }
      }
      inventory {
        isInStock
      }
      attributes: attributeIndex {
        attributeName
        attributeCode
        optionText
      }
      image {
        alt
        url
      }
      gallery {
        alt
        url
      }
      variantGroup {
        variantAttributes {
          attributeId
          attributeCode
          attributeName
          options {
            optionId
            optionText
            productId
          }
        }
        items {
          attributes {
            attributeCode
            optionId
          }
        }
      }
      reviewSummary {
        averageRating
        totalReviews
      }
      trustBadges {
        icon
        label
      }
      specBadges {
        icon
        value
        label
        badgeSize
      }
    }

}`;
