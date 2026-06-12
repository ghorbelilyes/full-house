import { Image } from '@components/common/Image.js';
import { useModuleEnabled } from '@components/common/modules/ModuleGate.js';
import { ProductNoThumbnail } from '@components/common/ProductNoThumbnail.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@components/common/ui/Dialog.js';
import { AddToCart } from '@components/frontStore/cart/AddToCart.js';
import { ProductData } from '@components/frontStore/catalog/ProductContext.js';
import CustomerAddressForm from '@components/frontStore/customer/address/addressForm/Index.js';
import { useOptionalWishlist } from '@components/frontStore/wishlist/WishlistContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import {
  ShoppingBag,
  ShoppingCart,
  MessageCircle,
  X,
  Loader2,
  Truck,
  CreditCard,
  MapPin,
  Package,
  CheckCircle,
  Heart,
  Star
} from 'lucide-react';
import React, { ReactNode, useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'react-toastify';

/* ═══════════════════ Shared Helpers ═══════════════════ */

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

const normalizeAttributeKey = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const BRAND_ATTRIBUTE_KEYS = new Set([
  'marque',
  'brand',
  'manufacturer',
  'fabricant'
]);

const getProductBrand = (product: ProductData): string | null => {
  const attributes = product.attributes || product.attributeIndex || [];
  const brandAttribute = attributes.find((attribute: any) => {
    const code = normalizeAttributeKey(attribute.attributeCode);
    const name = normalizeAttributeKey(attribute.attributeName);
    return BRAND_ATTRIBUTE_KEYS.has(code) || BRAND_ATTRIBUTE_KEYS.has(name);
  });
  const brand = brandAttribute?.optionText;
  return typeof brand === 'string' && brand.trim() ? brand.trim() : null;
};

const getPromotionLabel = (
  product: ProductData,
  discountPercent: number
): string | null => {
  const label = product.promotion?.promotionLabel;
  if (product.promotion?.isActive && typeof label === 'string' && label.trim()) {
    return label.trim();
  }
  return discountPercent > 0 ? `-${discountPercent}%` : null;
};

/* ═══════════════════ WhatsApp Settings Context ═══════════════════ */
/* Avoids N+1 API calls — fetch once, share everywhere */

interface WhatsAppConfig {
  enabled: boolean;
  number: string | null;
  template: string | null;
}

const WhatsAppConfigContext = createContext<WhatsAppConfig>({
  enabled: false,
  number: null,
  template: null
});

let _waConfigPromise: Promise<WhatsAppConfig> | null = null;

function fetchWhatsAppConfig(): Promise<WhatsAppConfig> {
  if (!_waConfigPromise) {
    _waConfigPromise = fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ setting { whatsappEnabled whatsappNumber whatsappMessageTemplate } }`
      })
    })
      .then((r) => r.json())
      .then((json) => {
        const s = json?.data?.setting;
        return {
          enabled: !!s?.whatsappEnabled,
          number: s?.whatsappNumber || null,
          template: s?.whatsappMessageTemplate || null
        };
      })
      .catch(() => ({ enabled: false, number: null, template: null }));
  }
  return _waConfigPromise;
}

function useWhatsAppConfig(): WhatsAppConfig {
  const [config, setConfig] = useState<WhatsAppConfig>({
    enabled: false,
    number: null,
    template: null
  });

  useEffect(() => {
    fetchWhatsAppConfig().then(setConfig);
  }, []);

  return config;
}

/* ═══════════════════ Sub-Components ═══════════════════ */

function ProductRating({ product }: { product: ProductData }) {
  const averageRating = Number(product.reviewSummary?.averageRating || 0);
  const totalReviews = Number(product.reviewSummary?.totalReviews || 0);

  if (!totalReviews) {
    return null;
  }

  const filledStars = Math.round(averageRating);

  return (
    <div className="flex items-center gap-1 text-xs text-slate-500">
      <span className="flex items-center gap-px text-amber-500">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className="h-3 w-3"
            fill={index < filledStars ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
        ))}
      </span>
      <span className="truncate text-[11px]">
        {averageRating.toFixed(1)} ({totalReviews})
      </span>
    </div>
  );
}

/* ── Promo Badge ─────────────── */
function PromoBadge({ percent }: { percent: number }) {
  return (
    <span className="absolute left-2 top-2 z-10 inline-flex items-center rounded-lg bg-red-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
      -{percent}%
    </span>
  );
}

/* ── Stock Badge ─────────────── */
function StockBadge({ inStock }: { inStock: boolean }) {
  if (inStock) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {_('In Stock')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      {_('Out of Stock')}
    </span>
  );
}

/* ── Price Display ─────────────── */
function PriceDisplay({
  product,
  size = 'default'
}: {
  product: ProductData;
  size?: 'default' | 'sm';
}) {
  const onSale = hasPromotion(product);
  const priceClass = size === 'sm' ? 'text-base' : 'text-lg';
  const oldClass = size === 'sm' ? 'text-[11px]' : 'text-xs';

  if (onSale) {
    return (
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className={`${priceClass} font-extrabold text-primary`}>
          {product.price.special!.text}
        </span>
        <span
          className={`${oldClass} font-medium text-slate-400 line-through`}
        >
          {product.price.regular.text}
        </span>
      </div>
    );
  }
  return (
    <span className={`${priceClass} font-extrabold text-slate-900`}>
      {product.price.regular.text}
    </span>
  );
}

/* ═══════════════════ Wishlist Heart ═══════════════════ */
function WishlistHeart({ productId }: { productId: number }) {
  const wishlist = useOptionalWishlist();
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState(false);

  if (!wishlist) return null;

  const inWishlist = wishlist.isInWishlist(productId);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const added = await wishlist.toggleItem(productId);
    if (added) {
      setPop(true);
      setTimeout(() => setPop(false), 400);
    }
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={inWishlist ? _('Remove from favorites') : _('Add to favorites')}
      className={`
        absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full
        border shadow-sm backdrop-blur-sm transition-all duration-200
        ${busy ? 'opacity-50' : 'hover:scale-110 active:scale-95'}
        ${inWishlist
          ? 'border-rose-200 bg-rose-50/90 text-rose-500'
          : 'border-white/60 bg-white/80 text-slate-400 hover:text-rose-500'
        }
      `}
    >
      <Heart
        className={`h-4 w-4 transition-transform ${pop ? 'scale-125' : ''}`}
        fill={inWishlist ? 'currentColor' : 'none'}
        strokeWidth={2}
      />
    </button>
  );
}

/* ═══════════════════ API helper ═══════════════════ */
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

/* ═══════════════════ Shipping Types & Components ═══════════════════ */
interface ShippingMethodOption {
  id: string;
  code: string;
  name: string;
  cost: { value: number; text: string };
}

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
      <div className="flex items-center gap-2 py-3 text-slate-500 text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>{_('Loading shipping methods...')}</span>
      </div>
    );
  }
  if (methods.length === 0) {
    return (
      <p className="text-xs text-slate-500 py-2">
        {_(
          'Please fill in your address to see available shipping methods.'
        )}
      </p>
    );
  }
  return (
    <div className="space-y-1.5">
      {methods.map((m) => (
        <label
          key={m.code}
          className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${
            selectedMethod === m.code
              ? 'border-primary bg-brand-soft'
              : 'border-slate-200 hover:border-brand-muted'
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="cardBuyNowShipping"
              value={m.code}
              checked={selectedMethod === m.code}
              onChange={() => onSelect(m.code)}
              className="accent-primary"
            />
            <span className="font-medium">{m.name}</span>
          </div>
          <span className="font-semibold">{m.cost.text}</span>
        </label>
      ))}
    </div>
  );
}

function OrderSummaryMini({
  product,
  shippingMethods,
  selectedShipping
}: {
  product: ProductData;
  shippingMethods: ShippingMethodOption[];
  selectedShipping: string;
}) {
  const onSale = hasPromotion(product);
  const unitPrice = onSale ? product.price.special! : product.price.regular;
  const lineTotal = unitPrice.value;
  const shippingMethod = shippingMethods.find(
    (m) => m.code === selectedShipping
  );
  const shippingCost = shippingMethod?.cost?.value || 0;
  const total = lineTotal + shippingCost;
  const formatPrice = (val: number) =>
    val.toFixed(3).replace('.', ',') + '\u00a0DT';

  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-2 text-xs">
      <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
        <Package className="w-3.5 h-3.5" />
        {_('Order summary')}
      </div>
      <div className="flex gap-2">
        {product.image?.url && (
          <img
            src={product.image.url}
            alt={product.image.alt || product.name}
            className="w-12 h-12 object-cover rounded flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium line-clamp-2">{product.name}</p>
          <p className="text-slate-500 mt-0.5">
            {_('Qty')}: 1
          </p>
          <p className="font-semibold mt-0.5">{unitPrice.text}</p>
        </div>
      </div>
      <div className="border-t border-slate-200 pt-2 space-y-1">
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
        <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
          <span>{_('Total')}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ BuyNow Checkout Modal ═══════════════════ */
function CardBuyNowCheckout({
  product,
  open,
  onClose
}: {
  product: ProductData;
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [cartId, setCartId] = useState<string | null>(null);
  const [shippingMethods, setShippingMethods] = useState<
    ShippingMethodOption[]
  >([]);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [creatingCart, setCreatingCart] = useState(false);
  const lastProvinceRef = useRef<string | null>(null);
  const form = useForm({ mode: 'onBlur', reValidateMode: 'onBlur' });

  useEffect(() => {
    if (open && !cartId && !creatingCart) {
      setCreatingCart(true);
      apiCall('/api/carts', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ sku: product.sku, qty: 1 }]
        })
      })
        .then((result) => {
          setCartId(result.data.cartId);
          setCreatingCart(false);
        })
        .catch((err: any) => {
          toast.error(err.message);
          setCreatingCart(false);
          onClose();
        });
    }
  }, [open, cartId, creatingCart, product.sku, onClose]);

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setStep('form');
        setCartId(null);
        setShippingMethods([]);
        setLoadingShipping(false);
        setSelectedShipping('');
        setSubmitting(false);
        setOrderNumber(null);
        setCreatingCart(false);
        lastProvinceRef.current = null;
        form.reset();
        onClose();
      }
    },
    [form, onClose]
  );

  const fetchShippingMethods = useCallback(
    async (cId: string, province: string) => {
      setLoadingShipping(true);
      try {
        const addressData = form.getValues('shippingAddress') || {};
        await apiCall(`/api/carts/${cId}/addresses`, {
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
                  id code name cost { value text }
                }
              }
            }`,
            variables: { id: cId, country: 'TN', province: province || null }
          })
        });
        const gqlJson = await gqlRes.json();
        const methods =
          gqlJson?.data?.cart?.availableShippingMethods || [];
        setShippingMethods(methods);
        setLoadingShipping(false);
        setSelectedShipping('');
      } catch {
        setLoadingShipping(false);
      }
    },
    [form]
  );

  const watchedProvince = form.watch('shippingAddress.province');
  useEffect(() => {
    if (
      step === 'form' &&
      cartId &&
      watchedProvince &&
      watchedProvince !== lastProvinceRef.current
    ) {
      lastProvinceRef.current = watchedProvince;
      const timer = setTimeout(
        () => fetchShippingMethods(cartId, watchedProvince),
        600
      );
      return () => clearTimeout(timer);
    }
  }, [watchedProvince, step, cartId, fetchShippingMethods]);

  const handleSubmitOrder = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error(_('Please fill in all required fields'));
      return;
    }
    if (!selectedShipping) {
      toast.error(_('Please choose a shipping method'));
      return;
    }
    setSubmitting(true);
    const values = form.getValues();
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
      setStep('success');
      setSubmitting(false);
      setOrderNumber(
        checkoutResult.data?.order_number ||
          checkoutResult.data?.uuid ||
          '—'
      );
    } catch (err: any) {
      toast.error(err.message || _('Order error'));
      setSubmitting(false);
    }
  }, [cartId, selectedShipping, form]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="card-buynow-dialog-content"
        showCloseButton={step !== 'processing'}
      >
        {creatingCart && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm text-slate-500">
              {_('Preparing your order...')}
            </p>
          </div>
        )}

        {step === 'form' && !creatingCart && (
          <FormProvider {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    <span>{_('Complete the order')}</span>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    {_('Email')}{' '}
                    <span className="text-slate-500 text-[10px]">
                      ({_('optional')})
                    </span>
                  </label>
                  <input
                    type="email"
                    {...form.register('contact.email')}
                    placeholder={_('your@email.com')}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {_('Shipping address')}
                  </div>
                  <CustomerAddressForm
                    areaId="cardBuyNowAddressForm"
                    fieldNamePrefix="shippingAddress"
                    showCity={false}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    {_('Shipping method')}
                  </div>
                  <ShippingMethodSelector
                    methods={shippingMethods}
                    loading={loadingShipping}
                    selectedMethod={selectedShipping}
                    onSelect={setSelectedShipping}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    {_('Payment method')}
                  </div>
                  <div className="p-2.5 rounded-lg border border-primary bg-brand-soft">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked
                        readOnly
                        className="accent-primary"
                      />
                      <span className="text-xs font-medium">
                        {_('Cash on delivery')}
                      </span>
                    </div>
                  </div>
                </div>

                <OrderSummaryMini
                  product={product}
                  shippingMethods={shippingMethods}
                  selectedShipping={selectedShipping}
                />
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                >
                  {submitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {submitting
                    ? _('Processing...')
                    : _('Confirm order')}
                </button>
              </div>
            </form>
          </FormProvider>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <DialogTitle>{_('Order confirmed!')}</DialogTitle>
            <p className="text-sm text-slate-500">
              {_('Your order has been placed successfully.')}
            </p>
            <div className="bg-slate-50 rounded-lg p-3 w-full">
              <p className="text-xs text-slate-500">
                {_('Order number')}
              </p>
              <p className="text-lg font-bold mt-1">
                #{orderNumber}
              </p>
            </div>
            <button
              type="button"
              className="w-full mt-2 rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-brand-strong"
              onClick={() => handleClose(false)}
            >
              {_('Close')}
            </button>
          </div>
        )}

        <style
          dangerouslySetInnerHTML={{
            __html: `
              .card-buynow-dialog-content {
                max-width: calc(100% - 2rem) !important;
                max-height: 90vh !important;
                overflow-y: auto !important;
              }
              @media (min-width: 640px) {
                .card-buynow-dialog-content {
                  max-width: 28rem !important;
                }
              }
            `
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════ Action Choice Modal ═══════════════════ */
function ProductActionModal({
  product,
  open,
  onClose
}: {
  product: ProductData;
  open: boolean;
  onClose: () => void;
}) {
  const whatsappModuleEnabled = useModuleEnabled('whatsappNotifications');
  const [showCheckout, setShowCheckout] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const whatsapp = useWhatsAppConfig();

  const onSale = hasPromotion(product);
  const displayPrice = onSale
    ? product.price.special!.text
    : product.price.regular.text;

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setShowCheckout(false);
        setAddingToCart(false);
        onClose();
      }
    },
    [onClose]
  );

  const handleWhatsApp = useCallback(() => {
    const template =
      whatsapp.template ||
      'Bonjour, je souhaite commander :\n\nProduit : {product}\nPrix : {price}\nQuantité : {qty}\nLien : {url}';
    const productUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${product.url}`
        : product.url || '';
    const message = template
      .replace(/{product}/g, product.name)
      .replace(/{price}/g, displayPrice)
      .replace(/{qty}/g, '1')
      .replace(/{url}/g, productUrl);
    window.open(
      `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
    handleClose(false);
  }, [whatsapp, product, displayPrice, handleClose]);

  useEffect(() => {
    if (!open) {
      setShowCheckout(false);
      setAddingToCart(false);
    }
  }, [open]);

  if (showCheckout) {
    return (
      <CardBuyNowCheckout
        product={product}
        open={open}
        onClose={() => {
          setShowCheckout(false);
          onClose();
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
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

        <div className="flex gap-3 p-3 rounded-lg bg-slate-50">
          {product.image?.url && (
            <img
              src={product.image.url}
              alt={product.image.alt || product.name}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm line-clamp-2">
              {product.name}
            </p>
            <p className="font-semibold text-sm mt-1">{displayPrice}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setShowCheckout(true)}
            className="w-full flex items-center gap-3 rounded-xl border-2 border-primary bg-brand-soft px-4 py-3.5 text-left transition-colors hover:bg-brand-soft"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <ShoppingBag className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-strong">
                {_('Yes, continue')}
              </p>
              <p className="text-[11px] text-primary/80">
                {_('Buy now and checkout directly')}
              </p>
            </div>
          </button>

          {whatsappModuleEnabled && whatsapp.enabled && whatsapp.number && (
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

          <AddToCart
            product={{
              sku: product.sku,
              isInStock: product.inventory.isInStock
            }}
            qty={1}
            onSuccess={() => {
              toast.success(_('Product added to cart'));
              handleClose(false);
            }}
            onError={(error) => toast.error(error)}
          >
            {(state, actions) => (
              <button
                type="button"
                disabled={!state.canAddToCart || state.isLoading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAddingToCart(true);
                  actions.addToCart().finally(() => setAddingToCart(false));
                }}
                className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-300 bg-white px-4 py-3.5 text-left transition-colors hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                  {(state.isLoading || addingToCart) ? (
                    <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4.5 h-4.5 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {(state.isLoading || addingToCart)
                      ? _('Adding...')
                      : _('Add to cart and continue shopping')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {_('Add to cart without leaving the page')}
                  </p>
                </div>
              </button>
            )}
          </AddToCart>

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
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════ Card Action Buttons ═══════════════════ */
function ProductCardActions({ product }: { product: ProductData }) {
  const whatsappModuleEnabled = useModuleEnabled('whatsappNotifications');
  const whatsapp = useWhatsAppConfig();
  const inStock = product.inventory.isInStock;
  const onSale = hasPromotion(product);
  const displayPrice = onSale
    ? product.price.special!.text
    : product.price.regular.text;

  const handleWhatsAppOrder = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!inStock || !whatsappModuleEnabled || !whatsapp.enabled || !whatsapp.number) {
        return;
      }
      const template =
        whatsapp.template ||
        'Bonjour, je souhaite commander :\n\nProduit : {product}\nPrix : {price}\nQuantité : {qty}\nLien : {url}';
      const productUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${product.url}`
          : product.url || '';
      const message = template
        .replace(/{product}/g, product.name)
        .replace(/{price}/g, displayPrice)
        .replace(/{qty}/g, '1')
        .replace(/{url}/g, productUrl);
      window.open(
        `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(message)}`,
        '_blank'
      );
    },
    [displayPrice, inStock, product.name, product.url, whatsapp]
  );

  return (
    <div className="mt-auto grid grid-cols-2 gap-1.5 pt-2.5">
      <button
        type="button"
        disabled={!inStock || !whatsappModuleEnabled || !whatsapp.enabled || !whatsapp.number}
        onClick={handleWhatsAppOrder}
        className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl bg-green-600 px-2 text-center text-[11px] font-bold leading-tight text-white transition-all hover:bg-green-700 hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">WhatsApp</span>
      </button>

      <AddToCart
        product={{
          sku: product.sku,
          isInStock: product.inventory.isInStock
        }}
        qty={1}
        onSuccess={() => toast.success(_('Product added to cart'))}
        onError={(error) => toast.error(error)}
      >
        {(state, actions) => (
          <button
            type="button"
            disabled={!state.canAddToCart || state.isLoading || !inStock}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (inStock) actions.addToCart();
            }}
            className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-center text-[11px] font-bold leading-tight text-slate-800 transition-all hover:border-primary hover:bg-brand-soft hover:text-primary active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.isLoading ? (
              <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span className="truncate">{state.isLoading ? _('Adding...') : _('Cart')}</span>
          </button>
        )}
      </AddToCart>
    </div>
  );
}

/* ═══════════════════ Main Product Card ═══════════════════ */
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
  const brand = getProductBrand(product);

  /* ── List layout ─────────────────────────────────────────── */
  if (layout === 'list') {
    return (
      <article className="group relative flex gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-200 sm:gap-6 sm:p-4">
        <WishlistHeart productId={product.productId} />

        <a
          href={product.url}
          className="relative flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 p-3 sm:h-40 sm:w-40 sm:p-4"
        >
          {onSale && <PromoBadge percent={discountPercent} />}
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

        <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0">
          <div>
            {brand && (
              <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                {brand}
              </p>
            )}
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800 sm:text-base">
              <a
                href={product.url}
                className="transition-colors hover:text-primary"
              >
                {product.name}
              </a>
            </h3>

            <div className="mt-2">
              <PriceDisplay product={product} />
            </div>

            <div className="mt-2">
              <StockBadge inStock={product.inventory.isInStock} />
            </div>
          </div>

          {showAddToCart && (
            <ProductCardActions product={product} />
          )}
        </div>
      </article>
    );
  }

  /* ── Grid layout ─────────────────────────────────────────── */
  return (
    <article className="product-card group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lg">
      {/* Wishlist heart */}
      <WishlistHeart productId={product.productId} />

      {/* Out-of-stock overlay */}
      {!product.inventory.isInStock && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-white/60">
          <span className="rounded-lg bg-slate-800/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
            {_('SOLD OUT')}
          </span>
        </div>
      )}

      {/* Image area */}
      <a
        href={product.url}
        className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white p-5"
      >
        {onSale && <PromoBadge percent={discountPercent} />}
        {product.image ? (
          <img
            src={product.image.url}
            alt={product.image.alt || product.name}
            loading="lazy"
            decoding="async"
            className="h-auto max-h-[85%] max-w-[88%] object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ProductNoThumbnail width={imageWidth} height={imageHeight} />
        )}
      </a>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 border-t border-slate-50 p-3 sm:p-3.5">
        {brand && (
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary sm:text-[11px]">
            {brand}
          </p>
        )}

        <h3 className="line-clamp-2 min-h-[36px] text-[13px] font-bold leading-snug text-slate-800 sm:text-sm">
          <a
            href={product.url}
            className="transition-colors hover:text-primary"
          >
            {product.name}
          </a>
        </h3>

        <ProductRating product={product} />

        {/* Price + Stock */}
        <div className="mt-auto flex items-end justify-between gap-1.5 pt-1">
          <PriceDisplay product={product} size="sm" />
          <StockBadge inStock={product.inventory.isInStock} />
        </div>

        {/* Action buttons */}
        <ProductCardActions product={product} />
      </div>

    </article>
  );
};
