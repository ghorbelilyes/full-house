import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import { CartItems } from '@components/frontStore/cart/CartItems.js';
import { CartSummaryItemsList } from '@components/frontStore/cart/CartSummaryItems.js';
import { CartTotalSummary } from '@components/frontStore/cart/CartTotalSummary.js';
import { CheckoutButton } from '@components/frontStore/checkout/CheckoutButton.js';
import {
  CheckoutProvider
} from '@components/frontStore/checkout/CheckoutContext.js';
import { ContactInformation } from '@components/frontStore/checkout/ContactInformation.js';
import { Payment } from '@components/frontStore/checkout/Payment.js';
import { Shipment } from '@components/frontStore/checkout/Shipment.js';
import React, { useState, useEffect } from 'react';
import './Checkout.scss';
import { useForm } from 'react-hook-form';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { useCartState } from '@components/frontStore/cart/CartContext.js';
import { useModuleEnabled } from '@components/common/modules/ModuleGate.js';
import { MessageCircle } from 'lucide-react';

interface CheckoutPageProps {
  placeOrderApi: string;
  getPaymentMethodApi: string;
  getShippingMethodApi: string;
  checkoutSuccessUrl: string;
}

/* ── WhatsApp checkout button ── */
function WhatsAppCheckoutButton() {
  const whatsappModuleEnabled = useModuleEnabled('whatsappNotifications');
  const cartState = useCartState();
  const [whatsapp, setWhatsapp] = useState<{ enabled: boolean; number: string | null }>({ enabled: false, number: null });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ setting { whatsappEnabled whatsappNumber } }`
      })
    })
      .then((r) => r.json())
      .then((json) => {
        const s = json?.data?.setting;
        if (s) {
          setWhatsapp({ enabled: !!s.whatsappEnabled, number: s.whatsappNumber || null });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || !whatsapp.enabled || !whatsapp.number || !whatsappModuleEnabled) return null;

  const handleWhatsApp = () => {
    const items = cartState?.data?.items || [];
    const lines = items.map((item: any) =>
      `• ${item.productName} × ${item.qty} — ${item.finalPrice?.text || item.productPrice?.text || ''}`
    );
    const total = cartState?.data?.grandTotal?.text || '';
    const message = `Bonjour, je souhaite passer commande :\n\n${lines.join('\n')}\n\nTotal : ${total}\n\nMerci de me confirmer la disponibilité.`;
    window.open(
      `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  return (
    <button
      type="button"
      onClick={handleWhatsApp}
      className="checkout-whatsapp-btn"
    >
      <MessageCircle className="w-5 h-5" />
      {_('Commander via WhatsApp')}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .checkout-whatsapp-btn {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              width: 100%;
              padding: 14px 20px;
              margin-top: 12px;
              border: 2px solid #25d366;
              border-radius: 12px;
              background: #e8fdf0;
              color: #128c4e;
              font-weight: 700;
              font-size: 15px;
              cursor: pointer;
              transition: all 0.2s;
            }
            .checkout-whatsapp-btn:hover {
              background: #d4f5e2;
              border-color: #1eba5a;
            }
          `
        }}
      />
    </button>
  );
}

export default function CheckoutPage({
  placeOrderApi,
  checkoutSuccessUrl
}: CheckoutPageProps) {
  const [disabled, setDisabled] = React.useState(false);
  const form = useForm({
    disabled: disabled,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {}
  });

  return (
    <CheckoutProvider
      form={form}
      enableForm={() => setDisabled(false)}
      disableForm={() => setDisabled(true)}
      allowGuestCheckout={true}
      placeOrderApi={placeOrderApi}
      checkoutSuccessUrl={checkoutSuccessUrl}
    >
      <div className="page-width grid grid-cols-1 md:grid-cols-2 gap-7 pt-8 pb-8">
        <Form form={form} submitBtn={false}>
          <Area id="checkoutFormBefore" noOuter />
          <div>
            <ContactInformation />
            <Shipment />
            <Payment />
            <CheckoutButton />
            <WhatsAppCheckoutButton />
          </div>
          <Area id="checkoutForm" noOuter />
          <Area id="checkoutFormAfter" noOuter />
        </Form>
        <div>
          <CartItems>
            {({ items, loading, showPriceIncludingTax }) => (
              <CartSummaryItemsList
                items={items}
                loading={loading}
                showPriceIncludingTax={showPriceIncludingTax}
                editable={false}
              />
            )}
          </CartItems>
          <CartTotalSummary />
        </div>
      </div>
    </CheckoutProvider>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    placeOrderApi: url(routeId: "createOrder")
    checkoutSuccessUrl: url(routeId: "checkoutSuccess")
  }
`;
