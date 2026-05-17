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

/* ── Spec-badge size presets ─────────────────────────────── */
const SPEC_SIZE_STYLES: Record<string, {
  padding: string; iconSize: number; iconBox: string;
  valueSize: string; labelSize: string; gap: string; borderRadius: string;
}> = {
  sm: {
    padding: '6px 8px', iconSize: 14, iconBox: '20px',
    valueSize: '12px', labelSize: '9px', gap: '6px', borderRadius: '10px'
  },
  md: {
    padding: '12px', iconSize: 20, iconBox: '28px',
    valueSize: '15px', labelSize: '11px', gap: '10px', borderRadius: '14px'
  },
  lg: {
    padding: '16px 14px', iconSize: 26, iconBox: '36px',
    valueSize: '19px', labelSize: '13px', gap: '12px', borderRadius: '16px'
  }
};

/* ── Spec Badges (under gallery) ────────────────────────── */
function SpecBadges({ specBadges }: { specBadges: any[] }) {
  if (!specBadges || specBadges.length === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent:  'flex-start',
        gap: '10px',
        marginTop: '24px'
      }}
      className="spec-badges-grid"
    >
      {specBadges.map((badge: any, i: number) => {
        const s = SPEC_SIZE_STYLES[badge.badgeSize] || SPEC_SIZE_STYLES.md;
        return (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              padding: s.padding,
              borderRadius: s.borderRadius,
              display: 'flex',
              alignItems: 'center',
              gap: s.gap
            }}
          >
            {badge.icon && (
              <span
                style={{
                  width: s.iconBox,
                  height: s.iconBox,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <BadgeIcon icon={badge.icon} size={s.iconSize} />
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              <strong
                style={{
                  display: 'block',
                  fontSize: s.valueSize,
                  fontWeight: 800,
                  color: '#e48125',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {badge.value}
              </strong>
              <span
                style={{
                  fontSize: s.labelSize,
                  color: '#6b7280',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block'
                }}
              >
                {badge.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Trust Badges (after add-to-cart) ───────────────────── */
function TrustBadges({ trustBadges }: { trustBadges: any[] }) {
  if (!trustBadges || trustBadges.length === 0) return null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginTop: '24px'
      }}
    >
      {trustBadges.map((badge: any, i: number) => (
        <div
          key={i}
          style={{
            background: '#f9fafb',
            padding: '14px',
            borderRadius: '14px',
            fontSize: '14px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BadgeIcon icon={badge.icon} size={20} />
          <span style={{ fontWeight: 600 }}>{badge.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Star Rating Summary ────────────────────────────────── */
function RatingSummary({ reviewSummary }: { reviewSummary: any }) {
  if (!reviewSummary) return null;
  const { averageRating, totalReviews } = reviewSummary;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(averageRating)) {
      stars.push('★');
    } else if (i - 0.5 <= averageRating) {
      stars.push('★');
    } else {
      stars.push('☆');
    }
  }
  return (
    <div
      style={{
        color: '#f59e0b',
        fontWeight: 700,
        marginBottom: '16px',
        fontSize: '15px'
      }}
    >
      {stars.join('')}{' '}
      <span style={{ color: '#6b7280', fontWeight: 500 }}>
        {averageRating > 0 ? averageRating.toFixed(1) : '—'} — {totalReviews}{' '}
        avis
      </span>
    </div>
  );
}

export default function ProductView({
  product
}: { product: any }) {
  const specBadges = product?.specBadges || [];
  const trustBadges = product?.trustBadges || [];
  const reviewSummary = product?.reviewSummary || null;
  return (
    <ProductProvider product={product}>
      <div className="product__detail">
        <Area id="productPageTop" className="product__page__top" />
        <div className="product__page__middle page-width">
          {/* ── Main 2-column grid ── */}
          <div
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '32px',
              display: 'grid',
              gridTemplateColumns: '1.1fr 0.9fr',
              gap: '48px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}
            className="product-layout-card"
          >
            {/* LEFT: gallery + spec badges */}
            <div style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
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
              <SpecBadges specBadges={specBadges} />
            </div>

            {/* RIGHT: info */}
            <div>
              <Area
                id="productPageMiddleRight"
                className="product__detail__right"
                coreComponents={[
                  {
                    component: {
                      default: (
                        <>
                          <ProductSingleName />
                          <RatingSummary reviewSummary={reviewSummary} />
                        </>
                      )
                    },
                    sortOrder: 10,
                    id: 'nameAndRating'
                  },
                  {
                    component: {
                      default: <ProductSingleAttributes />
                    },
                    sortOrder: 20,
                    id: 'attributes'
                  },
                  {
                    component: { default: <ProductSingleForm /> },
                    sortOrder: 30,
                    id: 'productForm'
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

      {/* Responsive override for mobile */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 900px) {
              .product-layout-card {
                grid-template-columns: 1fr !important;
                padding: 24px !important;
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
