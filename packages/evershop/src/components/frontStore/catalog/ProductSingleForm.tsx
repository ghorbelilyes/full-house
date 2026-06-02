import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import {
  AddToCart,
  AddToCartActions,
  AddToCartState
} from '@components/frontStore/cart/AddToCart.js';
import { useProduct } from '@components/frontStore/catalog/ProductContext.js';
import { VariantSelector } from '@components/frontStore/catalog/VariantSelector.js';
import { useModuleEnabled } from '@components/common/modules/ModuleGate.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React, { useEffect, useRef } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { toast } from 'react-toastify';
import ReactDOM from 'react-dom';

/* ── Pill-style quantity stepper (inline: label left, stepper right) ── */
function QuantityStepper({ form }: { form: UseFormReturn<any> }) {
  const qty = form.watch('qty') || 1;
  return (
    <div className="pdp-qty-row">
      <span className="pdp-qty-label">{_('Quantity')}</span>
      <div className="pdp-qty-stepper">
        <button
          type="button"
          onClick={() => form.setValue('qty', Math.max(1, qty - 1))}
          className="pdp-qty-btn"
          aria-label={_('Decrease quantity')}
        >
          −
        </button>
        <span className="pdp-qty-value">{qty}</span>
        <input type="hidden" {...form.register('qty', { valueAsNumber: true, min: 1 })} />
        <button
          type="button"
          onClick={() => form.setValue('qty', qty + 1)}
          className="pdp-qty-btn"
          aria-label={_('Increase quantity')}
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ── Price display with orange card ── */
function ProductPriceDisplay() {
  const { price, promotion } = useProduct() as any;
  const hasPromo =
    price.special &&
    price.special.value < price.regular.value;

  if (!hasPromo) {
    return (
      <div className="pdp-price-card pdp-price-card--simple">
        <span className="pdp-price-current">{price.regular.text}</span>
      </div>
    );
  }

  const savedAmount = parseFloat(
    (price.regular.value - price.special.value).toFixed(2)
  );
  const discountPercent = Math.round(
    ((price.regular.value - price.special.value) / price.regular.value) * 100
  );
  const promoLabel = promotion?.promotionLabel || `-${discountPercent}%`;

  return (
    <div className="pdp-price-card">
      <div className="pdp-price-line">
        <span className="pdp-price-current">{price.special.text}</span>
        <span className="pdp-price-old">{price.regular.text}</span>
        <span className="pdp-price-discount">{promoLabel}</span>
      </div>
      <div className="pdp-price-savings">
        🎉 {_('You save')} {savedAmount} DT ({discountPercent}%)
      </div>
    </div>
  );
}

/* ── Mobile Sticky CTA Portal ── */
function MobileStickyCtaPortal({
  addToCart,
  buyNow,
  isLoading,
  isInStock
}: {
  addToCart: () => void;
  buyNow: () => void;
  isLoading: boolean;
  isInStock: boolean;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const whatsappEnabled = useModuleEnabled('whatsappNotifications');

  useEffect(() => {
    containerRef.current = document.getElementById('pdpMobileCta');
    setMounted(!!containerRef.current);
  }, []);

  if (!mounted || !containerRef.current || !isInStock) return null;

  return ReactDOM.createPortal(
    <>
      <button
        type="button"
        onClick={addToCart}
        disabled={isLoading}
        className="pdp-sticky-btn pdp-sticky-btn--outline"
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        )}
        {_('Cart')}
      </button>
      {whatsappEnabled && (
      <button
        type="button"
        onClick={buyNow}
        disabled={isLoading}
        className="pdp-sticky-btn pdp-sticky-btn--whatsapp"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        {_('WhatsApp')}
      </button>
      )}
    </>,
    containerRef.current
  );
}

/* ── Main Form Component ── */
export function ProductSingleForm() {
  const {
    price,
    sku,
    inventory: { isInStock }
  } = useProduct();
  const form = useForm({ defaultValues: { qty: 1 } });
  const [addingToCart, setAddingToCart] = React.useState(false);

  // Reference to programmatically trigger buy now button
  const buyNowRef = useRef<HTMLButtonElement | null>(null);

  return (
    <Form id="productForm" method="POST" submitBtn={false} form={form}>
      <Area
        id="productSinglePageForm"
        coreComponents={[
          {
            component: {
              default: <ProductPriceDisplay />
            },
            sortOrder: 5,
            id: 'price'
          },
          {
            component: {
              default: <VariantSelector />
            },
            sortOrder: 10,
            id: 'variantSelector'
          },
          {
            component: {
              default: (
                <AddToCart
                  product={{
                    sku: sku,
                    isInStock: isInStock
                  }}
                  qty={form.watch('qty') || 1}
                  onSuccess={() => {}}
                  onError={(errorMessage) => {
                    toast.error(
                      errorMessage || _('Failed to add product to cart')
                    );
                  }}
                >
                  {(state: AddToCartState, actions: AddToCartActions) => {
                    const handleAddToCart = () => {
                      form
                        .trigger()
                        .then((isValid) => {
                          if (isValid) {
                            setAddingToCart(true);
                            actions.addToCart();
                          }
                        })
                        .finally(() => {
                          setAddingToCart(false);
                        });
                    };

                    const handleBuyNow = () => {
                      // Click the hidden buy now trigger
                      const btn = document.querySelector('[data-buy-now-trigger]') as HTMLButtonElement;
                      if (btn) btn.click();
                    };

                    return (
                      <div className="pdp-actions-block">
                        {state.isInStock === true && (
                          <>
                            <QuantityStepper form={form} />
                            {/* Desktop action buttons */}
                            <div className="pdp-actions-desktop">
                              <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={addingToCart || state.isLoading}
                                className="pdp-btn pdp-btn--primary"
                              >
                                {addingToCart || state.isLoading ? (
                                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                  </svg>
                                )}
                                {_('ADD TO CART')}
                              </button>
                              <Area id="productActionButtons" noOuter />
                            </div>
                            {/* Mobile sticky CTA portal */}
                            <MobileStickyCtaPortal
                              addToCart={handleAddToCart}
                              buyNow={handleBuyNow}
                              isLoading={addingToCart || state.isLoading}
                              isInStock={state.isInStock}
                            />
                          </>
                        )}
                        {state.isInStock === false && (
                          <button
                            type="button"
                            disabled
                            className="pdp-btn pdp-btn--disabled"
                          >
                            {_('SOLD OUT')}
                          </button>
                        )}
                      </div>
                    );
                  }}
                </AddToCart>
              )
            },
            sortOrder: 30,
            id: 'addToCartButton'
          }
        ]}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
/* ── Price card ── */
.pdp-price-card {
  background: #fff7f0;
  border: 1px solid #ffd9bb;
  border-radius: 14px;
  padding: 14px 16px;
  margin: 10px 0;
}
.pdp-price-card--simple {
  background: transparent;
  border: none;
  padding: 0;
  margin: 6px 0 10px;
}
.pdp-price-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pdp-price-current {
  font-size: 28px;
  font-weight: 800;
  color: #dc2626;
  line-height: 1.2;
}
.pdp-price-card--simple .pdp-price-current {
  font-size: 26px;
  color: var(--card-foreground, #1e293b);
}
.pdp-price-old {
  font-size: 16px;
  color: var(--muted-foreground, #9ca3af);
  text-decoration: line-through;
  font-weight: 500;
}
.pdp-price-discount {
  display: inline-block;
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.02em;
  vertical-align: middle;
}
.pdp-price-savings {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ecfdf5;
  color: #059669;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px dashed #6ee7b7;
  margin-top: 10px;
}

/* ── Quantity row ── */
.pdp-qty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0;
}
.pdp-qty-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--card-foreground, #1e293b);
}
.pdp-qty-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  overflow: hidden;
  background: var(--card, #fff);
}
.pdp-qty-btn {
  width: 40px;
  height: 40px;
  border: 0;
  background: transparent;
  font-size: 18px;
  font-weight: 600;
  color: var(--card-foreground, #1e293b);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.pdp-qty-btn:hover { background: var(--muted, #f1f5f9); }
.pdp-qty-btn:active { background: var(--accent, #e2e8f0); }
.pdp-qty-value {
  min-width: 40px;
  text-align: center;
  font-weight: 700;
  font-size: 16px;
  color: var(--card-foreground, #1e293b);
}

/* ── Desktop action buttons ── */
.pdp-actions-desktop {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 10px;
  margin-top: 2px;
}
.pdp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  cursor: pointer;
  font-weight: 700;
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 14px;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.pdp-btn--primary {
  background: linear-gradient(135deg, #ff6a00, #e65c00);
  color: #fff;
  box-shadow: 0 8px 18px rgba(255,106,0,0.3);
}
.pdp-btn--primary:hover { filter: brightness(1.05); transform: translateY(-1px); }
.pdp-btn--primary:active { transform: scale(0.98); }
.pdp-btn--primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.pdp-btn--disabled {
  background: var(--muted, #e2e8f0);
  color: var(--muted-foreground, #94a3b8);
  cursor: not-allowed;
  width: 100%;
  padding: 14px;
}

/* ── Mobile sticky CTA buttons ── */
.pdp-sticky-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  cursor: pointer;
  font-weight: 700;
  border-radius: 12px;
  padding: 13px 16px;
  font-size: 14px;
  transition: all 0.2s;
}
.pdp-sticky-btn--outline {
  background: var(--card, #fff);
  color: #ff6a00;
  border: 1.5px solid #ff6a00;
}
.pdp-sticky-btn--outline:hover { background: #fff7f0; }
.pdp-sticky-btn--primary {
  background: linear-gradient(135deg, #ff6a00, #e65c00);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255,106,0,0.3);
}
.pdp-sticky-btn--primary:hover { filter: brightness(1.05); }
.pdp-sticky-btn--whatsapp {
  background: #25d366;
  color: #fff;
  box-shadow: 0 4px 12px rgba(37,211,102,0.3);
}
.pdp-sticky-btn--whatsapp:hover { filter: brightness(1.05); }
.pdp-sticky-btn--primary:disabled,
.pdp-sticky-btn--outline:disabled,
.pdp-sticky-btn--whatsapp:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .pdp-price-current { font-size: 24px; }
  .pdp-price-card { padding: 12px; margin: 8px 0; }
  .pdp-qty-row { margin: 10px 0; }
  .pdp-actions-desktop { display: none; }
}

@media (min-width: 901px) {
  .pdp-mobile-cta { display: none !important; }
}

/* ── Dark mode price card ── */
[data-theme="dark"] .pdp-price-card {
  background: rgba(255,106,0,0.08);
  border-color: rgba(255,106,0,0.25);
}
[data-theme="dark"] .pdp-price-card--simple { background: transparent; border: none; }
[data-theme="dark"] .pdp-price-savings {
  background: rgba(5,150,105,0.12);
  border-color: rgba(5,150,105,0.3);
  color: #34d399;
}
`
        }}
      />
    </Form>
  );
}
