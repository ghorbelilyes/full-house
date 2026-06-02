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
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: `${size}px`, height: `${size}px`, flexShrink: 0, lineHeight: 1
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  return (
    <span
      style={{
        fontSize: `${size}px`, lineHeight: 1,
        width: `${size}px`, height: `${size}px`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
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
    <div className="pdp-spec-badges">
      {specBadges.map((badge: any, i: number) => (
        <div key={i} className="pdp-spec-badge">
          {badge.icon && (
            <span className="pdp-spec-badge__icon">
              <BadgeIcon icon={badge.icon} size={16} />
            </span>
          )}
          <div className="pdp-spec-badge__text">
            <strong>{badge.value}</strong>
            <small>{badge.label}</small>
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
    <div className="pdp-trust-badges">
      {trustBadges.map((badge: any, i: number) => (
        <div key={i} className="pdp-trust-badge">
          <span className="pdp-trust-badge__icon">
            <BadgeIcon icon={badge.icon} size={20} />
          </span>
          <span className="pdp-trust-badge__label">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Star Rating Summary ────────────────────────────────── */
function RatingSummary({ reviewSummary, sku }: { reviewSummary: any; sku: string }) {
  const avg = reviewSummary?.averageRating || 0;
  const total = reviewSummary?.totalReviews || 0;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(i <= Math.round(avg) ? '★' : '☆');
  }
  return (
    <div className="pdp-rating-row">
      <span className="pdp-stars">{stars.join('')}</span>
      <span className="pdp-rating-text">
        {avg > 0 ? avg.toFixed(1) : '—'} {total} {_('reviews')}
      </span>
      {sku && (
        <>
          <span className="pdp-rating-sep">·</span>
          <span className="pdp-rating-text">SKU: {sku}</span>
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
          <div className="pdp-card">
            {/* LEFT: gallery + spec badges */}
            <div className="pdp-left">
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
              <div className="pdp-specs-desktop">
                <SpecBadges specBadges={specBadges} />
              </div>
            </div>

            {/* RIGHT: product info */}
            <div className="pdp-right">
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
                          <div className="pdp-specs-mobile">
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
/* ═══════════════════════════════════════════════════════
   PDP Redesign — Desktop + Mobile
   ═══════════════════════════════════════════════════════ */

.pdp-redesign { padding-bottom: 0; }

/* ── Main card ── */
.pdp-card {
  background: var(--card, #fff);
  color: var(--card-foreground, #0f172a);
  border-radius: 24px;
  padding: 28px;
  display: grid;
  grid-template-columns: 0.6fr 1fr;
  gap: 32px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  border: 1px solid var(--border, #e5e7eb);
  align-items: start;
}

.pdp-left { min-width: 0; max-width: 100%; overflow: hidden; }
.pdp-right { position: relative; min-width: 0; }

/* Show/hide spec badges by viewport */
.pdp-specs-desktop { display: block; }
.pdp-specs-mobile { display: none; }

/* ── Spec badges ── */
.pdp-spec-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.pdp-spec-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border, #e5e7eb);
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--card, #fff);
  font-size: 12px;
}
.pdp-spec-badge__icon {
  width: 28px; height: 28px; border-radius: 8px;
  background: #fff3ea; color: #e48125;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.pdp-spec-badge__text { min-width: 0; }
.pdp-spec-badge__text strong {
  display: block; font-size: 12.5px; font-weight: 800;
  color: var(--card-foreground, #1e293b); line-height: 1.2;
}
.pdp-spec-badge__text small {
  display: block; font-size: 10px; color: var(--muted-foreground, #6b7280); line-height: 1.2;
}

/* ── Rating row ── */
.pdp-rating-row {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px; flex-wrap: wrap;
}
.pdp-stars { color: #f5a623; font-size: 14px; letter-spacing: 2px; }
.pdp-rating-text { color: var(--muted-foreground, #6b7280); font-size: 13px; }
.pdp-rating-sep { color: var(--border, #cbd5e1); }

/* ── Trust badges ── */
.pdp-trust-badges {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 14px;
}
.pdp-trust-badge {
  background: var(--muted, #f6f8fb);
  padding: 14px;
  border-radius: 12px;
  font-size: 13px;
  border: 1px solid var(--border, #e5e7eb);
  display: flex;
  align-items: center;
  gap: 10px;
}
.pdp-trust-badge__icon { font-size: 18px; flex-shrink: 0; }
.pdp-trust-badge__label { font-weight: 600; color: var(--card-foreground, #1e293b); line-height: 1.3; }

/* ── Product name ── */
.pdp-redesign .product__single__name {
  font-size: 21px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 6px;
  color: var(--card-foreground, #0f172a);
  padding-right: 50px; /* space for wishlist heart */
}

/* ── Attributes (specs table) ── */
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

/* ── Mobile Sticky CTA ── */
.pdp-mobile-cta {
  display: none;
}

/* ═══════════════════════════════════════════════════════
   Mobile (< 900px)
   ═══════════════════════════════════════════════════════ */
@media (max-width: 900px) {
  .pdp-card {
    grid-template-columns: 1fr;
    padding: 0;
    border-radius: 0;
    box-shadow: none;
    border: none;
    gap: 0;
    background: transparent;
  }

  .pdp-left {
    background: linear-gradient(135deg, #f7f8fb, #eef1f6);
    border-radius: 0;
  }

  .pdp-right {
    padding: 16px 16px 120px;
    background: var(--card, #fff);
  }

  .pdp-specs-desktop { display: none; }
  .pdp-specs-mobile { display: block; margin-top: 12px; }

  .pdp-redesign .product__single__name {
    font-size: 18px;
    padding-right: 0;
  }

  .pdp-rating-row { margin-bottom: 4px; }

  /* Trust badges stacked on mobile */
  .pdp-trust-badges {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  /* Mobile sticky CTA bar */
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

/* ── Dark mode via [data-theme] ── */
[data-theme="dark"] .pdp-spec-badge__icon {
  background: rgba(228,129,37,0.15);
}
[data-theme="dark"] .pdp-left {
  background: linear-gradient(135deg, #1a1f2e, #0f1420);
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
