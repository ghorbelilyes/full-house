import Area from '@components/common/Area.js';
import { InputField } from '@components/common/form/InputField.js';
import { SelectField } from '@components/common/form/SelectField.js';
import { NameAndTelephone } from '@components/frontStore/customer/address/addressForm/NameAndTelephone.js';
import { ProvinceAndPostcode } from '@components/frontStore/customer/address/addressForm/ProvinceAndPostcode.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { CustomerAddressGraphql } from '@evershop/evershop/types/customerAddress';
import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

// Hidden field registered with react-hook-form
function HiddenCountryField({ name }: { name: string }) {
  const { register } = useFormContext();
  return <input type="hidden" {...register(name)} value="TN" />;
}

interface CustomerAddressFormProps {
  allowCountries: {
    value: string;
    label: string;
    provinces: {
      value: string;
      label: string;
    }[];
  }[];
  address?: CustomerAddressGraphql;
  areaId?: string;
  fieldNamePrefix?: string;
  showCity?: boolean;
}
export function CustomerAddressForm({
  allowCountries = [],
  address = {},
  areaId = 'customerAddressForm',
  fieldNamePrefix = 'address',
  showCity = true
}: CustomerAddressFormProps) {
  const { watch, setValue } = useFormContext();

  const getFieldName = (fieldName: string) => {
    return fieldNamePrefix ? `${fieldNamePrefix}.${fieldName}` : fieldName;
  };

  // Deep clone address to avoid Immer frozen object mutations
  const safeAddress = address ? JSON.parse(JSON.stringify(address)) : {};

  // Always use Tunisia
  const selectedCountry = 'TN';

  useEffect(() => {
    setValue(getFieldName('country'), 'TN', { shouldDirty: true });
  }, []);
  return (
    <Area
      id={areaId}
      className="space-y-3"
      coreComponents={[
        {
          component: {
            default: (
              <NameAndTelephone
                fullName={safeAddress?.fullName || ''}
                telephone={safeAddress?.telephone || ''}
                getFieldName={getFieldName}
              />
            )
          },
          sortOrder: 10
        },
        {
          component: {
            default: (
              <InputField
                name={getFieldName('address_1')}
                label={_('Address')}
                placeholder={_('Address')}
                defaultValue={safeAddress?.address1 || ''}
                required
                validation={{
                  required: _('Address is required')
                }}
              />
            )
          },
          sortOrder: 20
        },
        {
          component: {
            default: (
              <InputField
                name={getFieldName('address_2')}
                label={_('Address 2')}
                placeholder={_('Address 2')}
                defaultValue={safeAddress?.address2 || ''}
              />
            )
          },
          sortOrder: 30
        },
        ...(showCity
          ? [
              {
                component: {
                  default: (
                    <InputField
                      name={getFieldName('city')}
                      label={_('City')}
                      placeholder={_('City')}
                      required
                      validation={{ required: _('City is required') }}
                      defaultValue={safeAddress?.city || ''}
                    />
                  )
                },
                sortOrder: 40
              }
            ]
          : []),
        {
          component: {
            default: (
              <HiddenCountryField name={getFieldName('country')} />
            )
          },
          sortOrder: 50
        },
        {
          component: {
            default: (
              <ProvinceAndPostcode
                key={selectedCountry}
                provinces={
                  allowCountries.find(
                    (country) => country.value === selectedCountry
                  )?.provinces || []
                }
                province={safeAddress?.province || { code: '' }}
                postcode={safeAddress?.postcode || ''}
                getFieldName={getFieldName}
              />
            )
          },
          sortOrder: 60
        }
      ]}
    />
  );
}
