import { Editor } from '@components/common/Editor.js';
import { Row } from '@components/common/form/Editor.js';
import { ProductData } from '@components/frontStore/catalog/ProductContext.js';
import { ProductListItemRender } from '@components/frontStore/catalog/ProductListItemRender.js';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';

const SliderComponent = Slider as any;

/** Return the correct slidesToShow for the current viewport width */
function getSlidesForWidth(width: number, desktopSlides: number): number {
  if (width < 480) return 1;
  if (width < 768) return 2;
  if (width < 1024) return Math.min(desktopSlides, 3);
  if (width < 1280) return Math.min(desktopSlides, 4);
  return desktopSlides;
}

/** Check if we are on a mobile viewport */
function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 480;
}

interface CollectionProductsProps {
  collection: {
    collectionId: number;
    name: string;
    description?: Row[];
    products: {
      items: ProductData[];
    };
  } | null;
  collectionProductsWidget?: {
    countPerRow?: number;
  };
}

export default function CollectionProducts({
  collection,
  collectionProductsWidget: { countPerRow = 4 } = {}
}: CollectionProductsProps) {
  const sliderRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [initialSlides, setInitialSlides] = useState(1); // mobile-first default
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setInitialSlides(
      getSlidesForWidth(window.innerWidth, Math.min(countPerRow || 4, products.length))
    );
    setIsMobile(isMobileViewport());
    setMounted(true);

    const handleResize = () => {
      setIsMobile(isMobileViewport());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBeforeChange = useCallback((_oldIndex: number, newIndex: number) => {
    setCurrentSlide(newIndex);
  }, []);

  if (!collection) {
    return null;
  }

  const products = collection?.products?.items || [];
  const desktopSlides = Math.min(countPerRow || 4, products.length);

  const totalProducts = products.length;

  const settings = {
    dots: false,
    infinite: products.length > initialSlides,
    speed: 400,
    slidesToShow: initialSlides,
    slidesToScroll: 1,
    arrows: false,
    swipe: true,
    swipeToSlide: true,
    draggable: true,
    touchThreshold: 8,
    touchMove: true,
    useCSS: true,
    cssEase: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    beforeChange: handleBeforeChange,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: Math.min(desktopSlides, 4),
          slidesToScroll: 1,
          centerMode: false,
          centerPadding: '0px'
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(desktopSlides, 3),
          slidesToScroll: 1,
          centerMode: false,
          centerPadding: '0px'
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          centerMode: true,
          centerPadding: '24px'
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: true,
          centerPadding: '40px',
          infinite: true,
          touchThreshold: 5,
          swipeToSlide: true
        }
      }
    ]
  };

  const showArrows = products.length > 1;

  return (
    <div className="py-10 collection__products__widget">
      <div className="page-width">
        <h3 className="text-center text-3xl font-extrabold tracking-tight text-slate-800 mb-2">
          {collection?.name}
        </h3>
        <div className="mx-auto mb-1 h-1 w-16 rounded-full bg-orange-500" />
        <div className="flex justify-center mb-8">
          {collection?.description && <Editor rows={collection?.description} />}
        </div>
        <div style={{ position: 'relative' }}>
          {mounted ? (
            <>
              <SliderComponent ref={sliderRef} {...settings}>
                {products.map((product) => (
                  <div key={product.productId} className="px-2">
                    <ProductListItemRender
                      product={product}
                      imageWidth={300}
                      imageHeight={300}
                      layout="grid"
                    />
                  </div>
                ))}
              </SliderComponent>

              {/* Mobile gradient edge hints */}
              {isMobile && totalProducts > 1 && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 24,
                      background: 'linear-gradient(to right, rgba(255,255,255,0.7), transparent)',
                      pointerEvents: 'none',
                      zIndex: 10
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 24,
                      background: 'linear-gradient(to left, rgba(255,255,255,0.7), transparent)',
                      pointerEvents: 'none',
                      zIndex: 10
                    }}
                  />
                </>
              )}

              {/* Mobile dot indicators + mini arrows */}
              {isMobile && totalProducts > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 12,
                    paddingBottom: 4
                  }}
                >
                  {/* Left arrow */}
                  <button
                    onClick={() => sliderRef.current?.slickPrev()}
                    aria-label="Précédent"
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.08)',
                      color: '#333',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polyline points="15 18 9 12 15 6" /></svg>
                  </button>

                  {/* Dots */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', maxWidth: 160 }}>
                    {products.map((_, idx) => {
                      const isActive = idx === (currentSlide % totalProducts);
                      return (
                        <button
                          key={idx}
                          type="button"
                          aria-label={`Aller au produit ${idx + 1}`}
                          onClick={() => sliderRef.current?.slickGoTo(idx)}
                          style={{
                            width: isActive ? 18 : 7,
                            height: 7,
                            borderRadius: isActive ? 4 : '50%',
                            border: 'none',
                            background: isActive ? '#f97316' : '#d1d5db',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            flexShrink: 0,
                            padding: 0
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Right arrow */}
                  <button
                    onClick={() => sliderRef.current?.slickNext()}
                    aria-label="Suivant"
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.08)',
                      color: '#333',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* SSR / pre-mount placeholder — single product, mobile-first */
            <div style={{ display: 'flex', gap: 12, overflow: 'hidden' }}>
              {products.slice(0, 1).map((product) => (
                <div
                  key={product.productId}
                  style={{ flex: '0 0 87%', minWidth: 0 }}
                  className="px-2"
                >
                  <ProductListItemRender
                    product={product}
                    imageWidth={300}
                    imageHeight={300}
                    layout="grid"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Arrows — only on md+ screens */}
          {mounted && showArrows && (
            <>
              <button
                onClick={() => sliderRef.current?.slickPrev()}
                aria-label="Précédent"
                type="button"
                className="hidden md:flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none h-10 w-10"
                style={{
                  position: 'absolute',
                  left: -20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button
                onClick={() => sliderRef.current?.slickNext()}
                aria-label="Suivant"
                type="button"
                className="hidden md:flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none h-10 w-10"
                style={{
                  position: 'absolute',
                  right: -20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const query = `
  query Query($collection: String, $count: Int, $countPerRow: Int) {
    collection (code: $collection) {
      collectionId
      name
      description
      products (filters: [{key: "limit", operation: eq, value: $count}]) {
        items {
          ...Product
        }
      }
    }
    collectionProductsWidget(collection: $collection, count: $count, countPerRow: $countPerRow) {
      countPerRow
    }
  }
`;

export const fragments = `
  fragment Product on Product {
    productId
    name
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
    }
    attributes: attributeIndex {
      attributeName
      attributeCode
      optionText
    }
    reviewSummary {
      averageRating
      totalReviews
    }
    inventory {
      isInStock
    }
    image {
      alt
      url
    }
    url
  }
`;

export const variables = `{
  collection: getWidgetSetting("collection"),
  count: getWidgetSetting("count"),
  countPerRow: getWidgetSetting("countPerRow", 4)
}`;
