import Area from '@components/common/Area.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import {
  useCartDispatch,
  useCartState
} from '@components/frontStore/cart/CartContext.js';
import {
  useCheckout,
  useCheckoutDispatch
} from '@components/frontStore/checkout/CheckoutContext.js';
import { ShippingMethods } from '@components/frontStore/checkout/shipment/ShippingMethods.js';
import CustomerAddressForm from '@components/frontStore/customer/address/addressForm/Index.js';
import {
  useCustomer
} from '@components/frontStore/customer/CustomerContext.jsx';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { MapPin, BookUser } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';

function SavedAddressSelector() {
  const { customer } = useCustomer();
  const { form } = useCheckout();
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const addresses = customer?.addresses || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!customer || addresses.length === 0) {
    return null;
  }

  const handleSelectAddress = (addressUuid: string) => {
    setIsOpen(false);
    if (addressUuid === '') {
      setSelectedAddressId('');
      // Clear form fields
      form.setValue('shippingAddress.full_name', '', { shouldDirty: true });
      form.setValue('shippingAddress.telephone', '', { shouldDirty: true });
      form.setValue('shippingAddress.address_1', '', { shouldDirty: true });
      form.setValue('shippingAddress.address_2', '', { shouldDirty: true });
      form.setValue('shippingAddress.city', '', { shouldDirty: true });
      form.setValue('shippingAddress.province', '', { shouldDirty: true });
      form.setValue('shippingAddress.postcode', '', { shouldDirty: true });
      return;
    }

    const address = addresses.find(
      (a) => a.uuid === addressUuid
    );
    if (!address) return;

    setSelectedAddressId(addressUuid);

    // Pre-fill form fields with saved address data
    form.setValue('shippingAddress.full_name', address.fullName || '', {
      shouldDirty: true
    });
    form.setValue('shippingAddress.telephone', address.telephone || '', {
      shouldDirty: true
    });
    form.setValue('shippingAddress.address_1', address.address1 || '', {
      shouldDirty: true
    });
    form.setValue('shippingAddress.address_2', address.address2 || '', {
      shouldDirty: true
    });
    form.setValue('shippingAddress.city', address.city || '', {
      shouldDirty: true
    });
    form.setValue(
      'shippingAddress.province',
      address.province?.code || '',
      { shouldDirty: true }
    );
    form.setValue('shippingAddress.postcode', address.postcode || '', {
      shouldDirty: true
    });
  };

  const selectedLabel =
    selectedAddressId === ''
      ? _('Nouvelle adresse')
      : (() => {
          const addr = addresses.find((a) => a.uuid === selectedAddressId);
          return addr
            ? `${addr.fullName} - ${addr.address1}, ${addr.city}${
                addr.province?.name ? `, ${addr.province.name}` : ''
              }`
            : _('Nouvelle adresse');
        })();

  const options = [
    { value: '', label: _('Nouvelle adresse') },
    ...addresses.map((addr) => ({
      value: addr.uuid,
      label: `${addr.fullName} - ${addr.address1}, ${addr.city}${
        addr.province?.name ? `, ${addr.province.name}` : ''
      }`
    }))
  ];

  return (
    <div className="mb-4">
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        <BookUser className="w-4 h-4" />
        {_('Utiliser une adresse enregistrée')}
      </label>
      <div className="saved-address-selector" ref={dropdownRef}>
        <button
          type="button"
          className="saved-address-selector__trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <span className="saved-address-selector__value">
            {selectedLabel}
          </span>
          <svg
            className={`saved-address-selector__chevron${
              isOpen ? ' saved-address-selector__chevron--open' : ''
            }`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {isOpen && (
          <div className="saved-address-selector__dropdown">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`saved-address-selector__option${
                  opt.value === selectedAddressId
                    ? ' saved-address-selector__option--selected'
                    : ''
                }`}
                onClick={() => handleSelectAddress(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Shipment() {
  const {
    data: {
      shippingAddress,
      noShippingRequired,
      availableShippingMethods,
      shippingMethod: selectedShippingMethod
    },
    loadingStates: { fetchingShippingMethods }
  } = useCartState();

  // Early return if no shipping is required
  if (noShippingRequired) {
    return null;
  }

  const {
    addShippingAddress,
    addShippingMethod,
    clearShippingMethod,
    fetchAvailableShippingMethods
  } = useCartDispatch();
  const { form } = useCheckout();
  const { updateCheckoutData } = useCheckoutDispatch();

  // Use useWatch for better performance and cleaner code
  const watchedShippingAddress = useWatch({
    control: form.control,
    name: 'shippingAddress'
  });

  const dirtyFields = form.formState.dirtyFields;
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchParamsRef = useRef<{
    country?: string;
    province?: string;
    postcode?: string;
  } | null>(
    // Initialize with current shipping address if available
    shippingAddress
      ? {
          country: shippingAddress.country?.code,
          province: shippingAddress.province?.code,
          postcode: shippingAddress.postcode || undefined
        }
      : null
  );

  // Track previous province to detect changes and reset shipping method
  const previousProvinceRef = useRef<string | undefined>(
    shippingAddress?.province?.code || undefined
  );

  // Watch province specifically for immediate shipping method reset
  const watchedProvince = useWatch({
    control: form.control,
    name: 'shippingAddress.province'
  });

  // Immediately reset shipping method when province changes
  useEffect(() => {
    if (watchedProvince !== undefined && watchedProvince !== previousProvinceRef.current) {
      previousProvinceRef.current = watchedProvince;
      form.setValue('shippingMethod', '');
      updateCheckoutData({ shippingMethod: undefined });
      clearShippingMethod();
    }
  }, [watchedProvince]);

  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        const country = form.getValues('shippingAddress.country');
        const province = form.getValues('shippingAddress.province');
        const postcode = form.getValues('shippingAddress.postcode');

        if (!country) {
          return;
        }

        // Check if parameters have actually changed
        const currentParams = { country, province, postcode };
        const lastParams = lastFetchParamsRef.current;

        if (
          lastParams &&
          lastParams.country === country &&
          lastParams.province === province &&
          lastParams.postcode === postcode
        ) {
          // Parameters haven't changed, skip API call
          return;
        }

        // Cache the current parameters
        lastFetchParamsRef.current = currentParams;

        await fetchAvailableShippingMethods({ country, province, postcode });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : _('Failed to update shipment')
        );
      }
    };

    if (watchedShippingAddress && dirtyFields.shippingAddress) {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        fetchShippingMethods();
      }, 800);
    }

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [watchedShippingAddress, dirtyFields.shippingAddress]); // Clean dependency array

  const updateShipment = async (method: { code: string; name: string }) => {
    try {
      const validate = await form.trigger('shippingAddress');
      if (!validate) {
        return false;
      }
      // Deep clone to prevent Immer from freezing react-hook-form's internal state
      const shippingAddress = JSON.parse(JSON.stringify(form.getValues('shippingAddress')));

      await addShippingAddress(shippingAddress);
      await addShippingMethod(method.code, method.name);
      updateCheckoutData({ shippingAddress, shippingMethod: method.code });
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : _('Failed to update shipment')
      );
      return false;
    }
  };

  return (
    <>
      <Area id="checkoutShipmentBefore" />
      <div className="checkout__shipment space-y-6 mt-6">
        <Card className="transition-all duration-200">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{_('Shipping Address')}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SavedAddressSelector />
            <CustomerAddressForm
              areaId="checkoutShippingAddressForm"
              fieldNamePrefix="shippingAddress"
              address={shippingAddress ? JSON.parse(JSON.stringify(shippingAddress)) : undefined}
              showCity={false}
            />
          </CardContent>
        </Card>
        <Area id="checkoutShippingMethodsBefore" noOuter />
        <ShippingMethods
          methods={availableShippingMethods?.map((method) => ({
            ...method,
            isSelected: method.code === selectedShippingMethod
          }))}
          shippingAddress={shippingAddress}
          onSelect={updateShipment}
          isLoading={fetchingShippingMethods}
        />
        <Area id="checkoutShippingMethodsAfter" noOuter />
      </div>
      <Area id="checkoutShipmentAfter" />
    </>
  );
}
