import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import { CartItems } from '@components/frontStore/cart/CartItems.js';
import { CartSummaryItemsList } from '@components/frontStore/cart/CartSummaryItems.js';
import { CartTotalSummary } from '@components/frontStore/cart/CartTotalSummary.js';
import { CheckoutButton } from '@components/frontStore/checkout/CheckoutButton.js';
import {
  CheckoutProvider,
  useCheckout,
  useCheckoutDispatch
} from '@components/frontStore/checkout/CheckoutContext.js';
import { ContactInformation } from '@components/frontStore/checkout/ContactInformation.js';
import { Payment } from '@components/frontStore/checkout/Payment.js';
import { Shipment } from '@components/frontStore/checkout/Shipment.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@components/common/ui/Dialog.js';
import { Button } from '@components/common/ui/Button.js';
import React, { useState } from 'react';
import './Checkout.scss';
import { useForm } from 'react-hook-form';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { Mail } from 'lucide-react';
import { toast } from 'react-toastify';

interface CheckoutPageProps {
  placeOrderApi: string;
  getPaymentMethodApi: string;
  getShippingMethodApi: string;
  checkoutSuccessUrl: string;
}

function EmailPromptDialog() {
  const { showEmailPrompt, form } = useCheckout();
  const { setShowEmailPrompt, proceedCheckoutWithoutEmail, updateCheckoutData } =
    useCheckoutDispatch();
  const [emailValue, setEmailValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEmail = async () => {
    if (!emailValue || !emailValue.includes('@')) {
      toast.error(_('Veuillez entrer un email valide'));
      return;
    }
    setIsSubmitting(true);
    try {
      form.setValue('contact.email', emailValue);
      updateCheckoutData({ customer: { email: emailValue } });
      setShowEmailPrompt(false);
      await proceedCheckoutWithoutEmail();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : _('Failed to checkout')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithout = async () => {
    setIsSubmitting(true);
    try {
      await proceedCheckoutWithoutEmail();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : _('Failed to checkout')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={showEmailPrompt}
      onOpenChange={(open) => {
        if (!open) setShowEmailPrompt(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              <span>{_('Ajouter votre email')}</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {_(
              'Si vous ajoutez votre email, cela vous permettra de suivre votre colis à chaque étape.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div>
          <input
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            placeholder={_('Entrez votre email')}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddEmail();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={handleContinueWithout}
            disabled={isSubmitting}
          >
            {_('Continuer sans email')}
          </Button>
          <Button
            type="button"
            onClick={handleAddEmail}
            disabled={isSubmitting}
          >
            {_('Ajouter')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <EmailPromptDialog />
      <div className="page-width grid grid-cols-1 md:grid-cols-2 gap-7 pt-8 pb-8">
        <Form form={form} submitBtn={false}>
          <Area id="checkoutFormBefore" noOuter />
          <div>
            <ContactInformation />
            <Shipment />
            <Payment />
            <CheckoutButton />
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
