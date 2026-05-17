import {
  useCheckout,
  useCheckoutDispatch
} from '@components/frontStore/checkout/CheckoutContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import {
  Address,
  CustomerAddressGraphql
} from '@evershop/evershop/types/customerAddress';
import React, { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

export function BillingAddress({
  billingAddress,
  addBillingAddress,
  addingBillingAddress,
  noShippingRequired
}: {
  billingAddress?: CustomerAddressGraphql;
  addBillingAddress?: (address: Address) => Promise<void>;
  addingBillingAddress?: boolean;
  noShippingRequired: boolean;
}) {
  const { form, checkoutData } = useCheckout();
  const { updateCheckoutData } = useCheckoutDispatch();

  const shippingAddress = useWatch({
    control: form.control,
    name: 'shippingAddress'
  });

  // Always use same as shipping address — no UI needed
  useEffect(() => {
    if (shippingAddress) {
      updateCheckoutData({ billingAddress: JSON.parse(JSON.stringify(shippingAddress)) });
    }
  }, [checkoutData.shippingAddress]);

  return null;
}
