import { Button } from '@components/common/ui/Button.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@components/common/ui/Dialog.js';
import {
  useCartDispatch,
  useCartState
} from '@components/frontStore/cart/CartContext.js';
import { useProduct } from '@components/frontStore/catalog/ProductContext.js';
import CustomerAddressForm from '@components/frontStore/customer/address/addressForm/Index.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { useModuleEnabled } from '@components/common/modules/ModuleGate.js';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  ShoppingBag,
  ShoppingCart,
  MessageCircle,
  X,
  Truck,
  CreditCard,
  CheckCircle,
  Loader2,
  MapPin,
  Package
} from 'lucide-react';

/* ─────────────────────── Types ─────────────────────── */
interface ShippingMethodOption {
  id: string;
  code: string;
  name: string;
  cost: { value: number; text: string };
}

interface WhatsAppConfig {
  enabled: boolean;
  number: string | null;
  template: string | null;
}

interface BuyNowState {
  step: 'actions' | 'form' | 'processing' | 'success';
  cartId: string | null;
  shippingMethods: ShippingMethodOption[];
  loadingShipping: boolean;
  orderNumber: string | null;
  submitting: boolean;
}

/* ─────────── API helper ─────────── */
const apiCall = async (url: string, opts: RequestInit = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json.error?.message || _('An error occurred'));
  return json;
};

/* ─────────── Shipping method selector ─────────── */
function ShippingMethodSelector({
  methods,
  loading,
  selectedMethod,
  onSelect
}: {
  methods: ShippingMethodOption[];
  loading: boolean;
  selectedMethod: string;
  onSelect: (code: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{_('Loading shipping methods...')}</span>
      </div>
    );
  }
  if (methods.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        {_(
          'Please fill in your address to see available shipping methods.'
        )}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {methods.map((m) => (
        <label
          key={m.code}
          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
            selectedMethod === m.code
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="buyNowShipping"
              value={m.code}
              checked={selectedMethod === m.code}
              onChange={() => onSelect(m.code)}
              className="accent-primary"
            />
            <span className="text-sm font-medium">{m.name}</span>
          </div>
          <span className="text-sm font-semibold">{m.cost.text}</span>
        </label>
      ))}
    </div>
  );
}

/* ─────────── Order summary mini card ─────────── */
function OrderSummaryMini({
  product,
  qty,
  shippingMethods,
  selectedShipping
}: {
  product: any;
  qty: number;
  shippingMethods: ShippingMethodOption[];
  selectedShipping: string;
}) {
  const hasSpecial =
    product.price?.special &&
    product.price.special.value < product.price.regular.value;
  const unitPrice = hasSpecial
    ? product.price.special
    : product.price.regular;
  const lineTotal = unitPrice.value * qty;
  const shippingMethod = shippingMethods.find(
    (m) => m.code === selectedShipping
  );
  const shippingCost = shippingMethod?.cost?.value || 0;
  const total = lineTotal + shippingCost;

  const formatPrice = (val: number) => {
    return val.toFixed(3).replace('.', ',') + '\u00a0DT';
  };

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold mb-2">
        <Package className="w-4 h-4" />
        {_('Order summary')}
      </div>
      <div className="flex gap-3">
        {product.image?.url && (
          <img
            src={product.image.url}
            alt={product.image.alt || product.name}
            className="w-16 h-16 object-cover rounded-md flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium line-clamp-2">{product.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {_('Qty')}: {qty}
          </p>
          <p className="text-sm font-semibold mt-1">
            {unitPrice.text} × {qty}
          </p>
        </div>
      </div>
      <div className="border-t border-border pt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{_('Subtotal')}</span>
          <span>{formatPrice(lineTotal)}</span>
        </div>
        {shippingMethod && (
          <div className="flex justify-between">
            <span>{_('Shipping')}</span>
            <span>{shippingMethod.cost.text}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
          <span>{_('Total')}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ Main Component ═══════════════════════ */
export default function BuyNowButton({
  createCartApi,
  placeOrderApi
}: {
  createCartApi: string;
  placeOrderApi: string;
}) {
  const whatsappModuleEnabled = useModuleEnabled('whatsappNotifications');
  const product = useProduct() as any;
  const cartDispatch = useCartDispatch();
  const cartState = useCartState();

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<BuyNowState>({
    step: 'actions',
    cartId: null,
    shippingMethods: [],
    loadingShipping: false,
    orderNumber: null,
    submitting: false
  });
  const [selectedShipping, setSelectedShipping] = useState('');
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [whatsapp, setWhatsapp] = useState<WhatsAppConfig>({
    enabled: false,
    number: null,
    template: null
  });
  const [loadedWa, setLoadedWa] = useState(false);
  const lastProvinceRef = useRef<string | null>(null);

  const productForm = useFormContext();
  const checkoutForm = useForm({ mode: 'onBlur', reValidateMode: 'onBlur' });

  // Read quantity from the product page form
  const readQtyFromPage = useCallback(() => {
    const qtyInput = document.querySelector<HTMLInputElement>(
      '#productForm input[name="qty"]'
    );
    return qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
  }, []);

  // Get current selected variant SKU from the product page
  const getProductSku = useCallback(() => {
    const inputs = document.querySelectorAll<HTMLInputElement>(
      '#productForm input[type="hidden"]'
    );
    for (const input of inputs) {
      if (
        input.name === 'variant_sku' ||
        input.name === 'sku' ||
        input.name === 'product_sku'
      ) {
        if (input.value) return input.value;
      }
    }
    return product.sku;
  }, [product.sku]);

  const isInStock = product.inventory?.isInStock;

  const validateProductSelection = useCallback(async () => {
    const variantIsValid = await productForm.trigger('variant_selected');
    if (!variantIsValid) {
      toast.error(_('Please select variant options'));
      document
        .querySelector('.variant__container')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    return productForm.trigger('qty');
  }, [productForm]);

  // Fetch WhatsApp settings on mount
  useEffect(() => {
    if (!loadedWa) {
      fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{ setting { whatsappEnabled whatsappNumber whatsappMessageTemplate } }`
        })
      })
        .then((r) => r.json())
        .then((json) => {
          const s = json?.data?.setting;
          if (s) {
            setWhatsapp({
              enabled: !!s.whatsappEnabled,
              number: s.whatsappNumber || null,
              template: s.whatsappMessageTemplate || null
            });
          }
          setLoadedWa(true);
        })
        .catch(() => setLoadedWa(true));
    }
  }, [loadedWa]);

  /* ── Reset on close ── */
  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setState({
          step: 'actions',
          cartId: null,
          shippingMethods: [],
          loadingShipping: false,
          orderNumber: null,
          submitting: false
        });
        setSelectedShipping('');
        setAddingToCart(false);
        lastProvinceRef.current = null;
        checkoutForm.reset();
      }
      setOpen(isOpen);
    },
    [checkoutForm]
  );

  /* ── Open modal ── */
  const handleBuyNow = useCallback(async () => {
    const isValid = await validateProductSelection();
    if (!isValid) return;
    setQty(readQtyFromPage());
    setOpen(true);
  }, [readQtyFromPage, validateProductSelection]);

  /* ── Action 1: Continue to checkout → Create isolated cart ── */
  const handleContinueCheckout = useCallback(async () => {
    const isValid = await validateProductSelection();
    if (!isValid) return;

    const currentSku = getProductSku();
    const currentQty = qty;

    setState((s) => ({ ...s, step: 'processing' }));
    try {
      const result = await apiCall(createCartApi, {
        method: 'POST',
        body: JSON.stringify({
          items: [{ sku: currentSku, qty: currentQty }]
        })
      });
      setState((s) => ({
        ...s,
        step: 'form',
        cartId: result.data.cartId
      }));
    } catch (err: any) {
      toast.error(err.message);
      setState((s) => ({ ...s, step: 'actions' }));
    }
  }, [createCartApi, qty, getProductSku, validateProductSelection]);

  /* ── Action 2: WhatsApp order (direct, no popup) ── */
  const handleWhatsApp = useCallback(() => {
    const currentQty = readQtyFromPage();
    const template =
      whatsapp.template ||
      'Bonjour, je souhaite commander :\n\nProduit : {product}\nPrix : {price}\nQuantité : {qty}\nLien : {url}';

    const hasSpecial =
      product.price?.special &&
      product.price.special.value < product.price.regular.value;
    const displayPrice = hasSpecial
      ? product.price.special.text
      : product.price.regular.text;

    const productUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${product.url || window.location.pathname}`
        : product.url || '';

    const message = template
      .replace(/{product}/g, product.name)
      .replace(/{price}/g, displayPrice)
      .replace(/{qty}/g, String(currentQty))
      .replace(/{url}/g, productUrl);

    window.open(
      `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  }, [whatsapp, product, readQtyFromPage]);

  /* ── Direct WhatsApp from PDP button ── */
  const handleDirectWhatsApp = useCallback(async () => {
    const isValid = await validateProductSelection();
    if (!isValid) return;
    handleWhatsApp();
  }, [validateProductSelection, handleWhatsApp]);

  /* ── Action 3: Add to cart ── */
  const handleAddToCart = useCallback(async () => {
    const currentSku = getProductSku();
    const currentQty = qty;
    if (!cartState.data) {
      toast.error(_('Cart is not initialized'));
      return;
    }
    setAddingToCart(true);
    try {
      cartDispatch.clearError();
      await cartDispatch.addItem({
        sku: currentSku,
        qty: currentQty
      });
      toast.success(_('Product added to cart'));
      handleClose(false);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : _('Failed to add item to cart');
      toast.error(msg);
    } finally {
      setAddingToCart(false);
    }
  }, [getProductSku, qty, cartState.data, cartDispatch, handleClose]);

  /* ── Fetch shipping methods via GraphQL ── */
  const fetchShippingMethods = useCallback(
    async (cartId: string, province: string) => {
      setState((s) => ({ ...s, loadingShipping: true }));
      try {
        const addressData = checkoutForm.getValues('shippingAddress') || {};
        await apiCall(`/api/carts/${cartId}/addresses`, {
          method: 'POST',
          body: JSON.stringify({
            address: { ...addressData, country: 'TN' },
            type: 'shipping'
          })
        });

        const gqlRes = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query GetShipping($id: String!, $country: String!, $province: String) {
              cart(id: $id) {
                availableShippingMethods(country: $country, province: $province) {
                  id
                  code
                  name
                  cost { value text }
                }
              }
            }`,
            variables: { id: cartId, country: 'TN', province: province || null }
          })
        });
        const gqlJson = await gqlRes.json();
        const methods =
          gqlJson?.data?.cart?.availableShippingMethods || [];

        setState((s) => ({
          ...s,
          shippingMethods: methods,
          loadingShipping: false
        }));
        setSelectedShipping('');
      } catch (err: any) {
        setState((s) => ({ ...s, loadingShipping: false }));
        toast.error(
          err.message ||
            _('Unable to load shipping methods')
        );
      }
    },
    [checkoutForm]
  );

  // Watch province changes and debounce shipping method fetch
  const watchedProvince = checkoutForm.watch('shippingAddress.province');
  useEffect(() => {
    if (
      state.step === 'form' &&
      state.cartId &&
      watchedProvince &&
      watchedProvince !== lastProvinceRef.current
    ) {
      lastProvinceRef.current = watchedProvince;
      const timer = setTimeout(
        () => fetchShippingMethods(state.cartId!, watchedProvince),
        600
      );
      return () => clearTimeout(timer);
    }
  }, [watchedProvince, state.step, state.cartId, fetchShippingMethods]);

  /* ── Submit order ── */
  const handleSubmitOrder = useCallback(async () => {
    const isValid = await checkoutForm.trigger();
    if (!isValid) {
      toast.error(_('Please fill in all required fields'));
      return;
    }
    if (!selectedShipping) {
      toast.error(_('Please choose a shipping method'));
      return;
    }

    setState((s) => ({ ...s, submitting: true }));
    const cartId = state.cartId;
    const values = checkoutForm.getValues();

    try {
      const address = {
        ...(values.shippingAddress || {}),
        country: 'TN'
      };
      await apiCall(`/api/carts/${cartId}/addresses`, {
        method: 'POST',
        body: JSON.stringify({ address, type: 'shipping' })
      });
      await apiCall(`/api/carts/${cartId}/addresses`, {
        method: 'POST',
        body: JSON.stringify({ address, type: 'billing' })
      });
      await apiCall(`/api/carts/${cartId}/shippingMethods`, {
        method: 'POST',
        body: JSON.stringify({ method_code: selectedShipping })
      });
      await apiCall(`/api/carts/${cartId}/paymentMethods`, {
        method: 'POST',
        body: JSON.stringify({
          method_code: 'cod',
          method_name: _('Cash on delivery')
        })
      });
      const email = values.contact?.email;
      if (email) {
        await apiCall(`/api/carts/${cartId}/contacts`, {
          method: 'POST',
          body: JSON.stringify({ email })
        });
      }
      const checkoutResult = await apiCall(
        `/api/carts/${cartId}/checkout`,
        {
          method: 'POST',
          body: JSON.stringify({
            cart_id: cartId,
            customer: { email: email || '' },
            shippingAddress: address,
            billingAddress: address,
            shippingMethod: selectedShipping,
            paymentMethod: 'cod'
          })
        }
      );

      setState((s) => ({
        ...s,
        step: 'success',
        submitting: false,
        orderNumber:
          checkoutResult.data?.order_number ||
          checkoutResult.data?.uuid ||
          '—'
      }));
    } catch (err: any) {
      toast.error(err.message || _('Order error'));
      setState((s) => ({ ...s, submitting: false }));
    }
  }, [state.cartId, selectedShipping, checkoutForm]);

  /* ── Do not render if out of stock or module disabled ── */
  if (!isInStock || !whatsappModuleEnabled) return null;

  const hasSpecial =
    product.price?.special &&
    product.price.special.value < product.price.regular.value;
  const displayPrice = hasSpecial
    ? product.price.special.text
    : product.price.regular.text;

  /* ═══════════════════ Render ═══════════════════ */
  return (
    <>
      <button
        type="button"
        onClick={handleDirectWhatsApp}
        data-buy-now-trigger
        className="pdp-btn pdp-btn--outline pdp-btn--whatsapp"
      >
        <MessageCircle className="h-5 w-5" />
        {_('COMMANDER VIA WHATSAPP')}
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="buy-now-dialog-content"
          showCloseButton={state.step !== 'processing'}
        >
          {/* ── Step: 4 Action Choices ── */}
          {state.step === 'actions' && (
            <>
              <DialogHeader>
                <DialogTitle>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    <span>{_('Quick purchase')}</span>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {_('What would you like to do?')}
                </DialogDescription>
              </DialogHeader>

              {/* Product preview */}
              <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                {product.image?.url && (
                  <img
                    src={product.image.url}
                    alt={product.image.alt || product.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                )}
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {_('Qty')}: {qty}
                  </p>
                  <p className="font-semibold text-sm mt-1">
                    {displayPrice}
                  </p>
                </div>
              </div>

              {/* 2 action buttons */}
              <div className="space-y-2.5">
                {/* Option 1: Add to cart */}
                <button
                  type="button"
                  disabled={addingToCart || cartState.loading}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl border-2 border-primary bg-brand-soft px-4 py-3.5 text-left transition-colors hover:bg-brand-soft disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                    {addingToCart || cartState.loading ? (
                      <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4.5 h-4.5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-strong">
                      {addingToCart || cartState.loading
                        ? _('Adding...')
                        : _('Add to cart')}
                    </p>
                    <p className="text-[11px] text-primary/80">
                      {_('Add to cart and continue shopping')}
                    </p>
                  </div>
                </button>

                {/* Option 2: WhatsApp (conditional) */}
                {whatsapp.enabled && whatsapp.number && (
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="w-full flex items-center gap-3 rounded-xl border-2 border-green-500 bg-green-50 px-4 py-3.5 text-left transition-colors hover:bg-green-100"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
                      <MessageCircle className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-700">
                        {_('Order via WhatsApp')}
                      </p>
                      <p className="text-[11px] text-green-600/80">
                        {_('Send your order on WhatsApp')}
                      </p>
                    </div>
                  </button>
                )}

                {/* Cancel */}
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center">
                    <X className="w-4.5 h-4.5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      {_('Cancel')}
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ── Step: Processing (creating cart) ── */}
          {state.step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {_('Preparing your order...')}
              </p>
            </div>
          )}

          {/* ── Step: Checkout Form ── */}
          {state.step === 'form' && (
            <FormProvider {...checkoutForm}>
              <form onSubmit={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      <span>{_('Complete the order')}</span>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-4">
                  {/* ── Contact email (optional) ── */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {_('Email')}{' '}
                      <span className="text-muted-foreground text-xs">
                        ({_('optional')})
                      </span>
                    </label>
                    <input
                      type="email"
                      {...checkoutForm.register('contact.email')}
                      placeholder={_('your@email.com')}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* ── Shipping address ── */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <MapPin className="w-4 h-4" />
                      {_('Shipping address')}
                    </div>
                    <CustomerAddressForm
                      areaId="buyNowAddressForm"
                      fieldNamePrefix="shippingAddress"
                      showCity={false}
                    />
                  </div>

                  {/* ── Shipping method ── */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      <Truck className="w-4 h-4" />
                      {_('Shipping method')}
                    </div>
                    <ShippingMethodSelector
                      methods={state.shippingMethods}
                      loading={state.loadingShipping}
                      selectedMethod={selectedShipping}
                      onSelect={setSelectedShipping}
                    />
                  </div>

                  {/* ── Payment (COD only) ── */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      <CreditCard className="w-4 h-4" />
                      {_('Payment method')}
                    </div>
                    <div className="p-3 rounded-lg border border-primary bg-primary/5">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked
                          readOnly
                          className="accent-primary"
                        />
                        <span className="text-sm font-medium">
                          {_('Cash on delivery')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Order summary ── */}
                  <OrderSummaryMini
                    product={product}
                    qty={qty}
                    shippingMethods={state.shippingMethods}
                    selectedShipping={selectedShipping}
                  />
                </div>

                <div className="mt-6">
                  <Button
                    variant="default"
                    size="lg"
                    type="button"
                    className="w-full py-5"
                    onClick={handleSubmitOrder}
                    disabled={state.submitting}
                    isLoading={state.submitting}
                  >
                    {state.submitting
                      ? _('Processing...')
                      : _('Confirm order')}
                  </Button>
                </div>
              </form>
            </FormProvider>
          )}

          {/* ── Step: Success ── */}
          {state.step === 'success' && (
            <div className="flex flex-col items-center text-center py-4 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle>{_('Order confirmed!')}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {_('Your order has been placed successfully.')}
              </p>
              <div className="bg-muted/50 rounded-lg p-4 w-full">
                <p className="text-xs text-muted-foreground">
                  {_('Order number')}
                </p>
                <p className="text-lg font-bold mt-1">
                  #{state.orderNumber}
                </p>
              </div>
              <Button
                variant="default"
                size="lg"
                type="button"
                className="w-full mt-2"
                onClick={() => handleClose(false)}
              >
                {_('Close')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .pdp-btn--outline {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              border: 1.5px solid #ff6a00;
              background: #fff;
              color: #ff6a00;
              cursor: pointer;
              font-weight: 700;
              border-radius: 14px;
              padding: 14px 18px;
              font-size: 14px;
              transition: all 0.2s;
              text-transform: uppercase;
              letter-spacing: 0.03em;
              width: 100%;
            }
            .pdp-btn--outline:hover { background: #fff7f0; transform: translateY(-1px); }
            .pdp-btn--outline:active { transform: scale(0.98); }
            .pdp-btn--whatsapp {
              border-color: #25d366;
              color: #128c4e;
              background: #e8fdf0;
            }
            .pdp-btn--whatsapp:hover { background: #d4f5e2; border-color: #1eba5a; transform: translateY(-1px); }
            .buy-now-dialog-content {
              max-width: calc(100% - 2rem) !important;
              max-height: 90vh !important;
              overflow-y: auto !important;
            }
            @media (min-width: 640px) {
              .buy-now-dialog-content {
                max-width: 32rem !important;
              }
            }
          `
        }}
      />
    </>
  );
}

export const layout = {
  areaId: 'productActionButtons',
  sortOrder: 10
};

export const query = `
  query Query {
    createCartApi: url(routeId: "createCart")
    placeOrderApi: url(routeId: "createOrder")
  }
`;
