import { CustomerAddressForm } from '@components/frontStore/customer/address/addressForm/AddressForm.js';
import { AddressFormLoadingSkeleton } from '@components/frontStore/customer/address/addressForm/AddressFormLoadingSkeleton.js';
import { CustomerAddressGraphql } from '@evershop/evershop/types/customerAddress';
import React from 'react';
import { useQuery } from 'urql';

const CountriesQuery = `
  query Country {
    allowedCountries  {
      value: code
      label: name
      provinces {
        label: name
        value: code
      }
    }
  }
`;

interface IndexProps {
  address?: CustomerAddressGraphql;
  areaId?: string;
  fieldNamePrefix?: string;
  showCity?: boolean;
}

export default function Index({
  address = {},
  areaId = 'customerAddressForm',
  fieldNamePrefix = 'address',
  showCity = true
}: IndexProps) {
  const [result] = useQuery({
    query: CountriesQuery
  });

  const { data, fetching, error } = result;

  if (fetching) return <AddressFormLoadingSkeleton />;
  if (error) {
    return <p className="text-destructive">{error.message}</p>;
  }

  return (
    <CustomerAddressForm
      address={address}
      areaId={areaId}
      allowCountries={data.allowedCountries}
      fieldNamePrefix={fieldNamePrefix}
      showCity={showCity}
    />
  );
}
