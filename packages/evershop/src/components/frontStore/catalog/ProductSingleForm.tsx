import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import { NumberField } from '@components/common/form/NumberField.js';
import { Button } from '@components/common/ui/Button.js';
import {
  AddToCart,
  AddToCartActions,
  AddToCartState
} from '@components/frontStore/cart/AddToCart.js';
import { useProduct } from '@components/frontStore/catalog/ProductContext.js';
import { VariantSelector } from '@components/frontStore/catalog/VariantSelector.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

const PromoBadgeInline: React.CSSProperties = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '0.75rem',
  padding: '4px 10px',
  borderRadius: '4px',
  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
  letterSpacing: '0.02em',
  textTransform: 'uppercase' as const,
  marginLeft: '8px',
  verticalAlign: 'middle'
};

function ProductPriceDisplay() {
  const { price, promotion } = useProduct() as any;
  const hasPromo =
    price.special &&
    price.special.value < price.regular.value;

  if (!hasPromo) {
    return (
      <div className="product__single__price text-2xl font-bold">
        {price.regular.text}
      </div>
    );
  }

  const savedAmount = parseFloat((price.regular.value - price.special.value).toFixed(2));
  const discountPercent = Math.round(
    ((price.regular.value - price.special.value) / price.regular.value) * 100
  );

  const promoLabel =
    promotion?.promotionLabel || `-${discountPercent}%`;

  return (
    <div className="product__single__price__wrapper">
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-3xl font-bold"
          style={{ color: '#dc2626' }}
        >
          {price.special.text}
        </span>
        <span
          className="text-lg"
          style={{
            textDecoration: 'line-through',
            color: '#9ca3af'
          }}
        >
          {price.regular.text}
        </span>
        <span style={PromoBadgeInline}>
          {promoLabel}
        </span>
      </div>
      <div
        className="mt-2 text-sm font-medium px-3 py-1.5 rounded-md inline-flex items-center gap-1"
        style={{
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca'
        }}
      >
        🎉 {_('You save')} {savedAmount} DT ({discountPercent}%)
      </div>

    </div>
  );
}

export function ProductSingleForm() {
  const {
    price,
    sku,
    inventory: { isInStock }
  } = useProduct();
  const form = useForm();
  const [addingToCart, setAddingToCart] = React.useState(false);
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
                  onSuccess={() => {
                    // To show the mini cart after adding a product to cart
                  }}
                  onError={(errorMessage) => {
                    toast.error(
                      errorMessage || _('Failed to add product to cart')
                    );
                  }}
                >
                  {(state: AddToCartState, actions: AddToCartActions) => (
                    <div className="mt-6 space-y-3">
                      {state.isInStock === true && (
                        <>
                          <NumberField
                            name="qty"
                            label={_('Quantity')}
                            className="w-24"
                            min={1}
                            required
                            placeholder={_('Quantity')}
                            defaultValue={1}
                            wrapperClassName="w-1/2"
                          />
                          <Button
                            variant={'default'}
                            size={'lg'}
                            onClick={() => {
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
                            }}
                            className="w-full py-6"
                            isLoading={addingToCart || state.isLoading}
                          >
                            {_('ADD TO CART')}
                          </Button>
                        </>
                      )}
                      {state.isInStock === false && (
                        <Button
                          onClick={() => {}}
                          className="w-full py-6"
                          disabled
                        >
                          {_('SOLD OUT')}
                        </Button>
                      )}
                    </div>
                  )}
                </AddToCart>
              )
            },
            sortOrder: 30,
            id: 'addToCartButton'
          }
        ]}
      />
    </Form>
  );
}
