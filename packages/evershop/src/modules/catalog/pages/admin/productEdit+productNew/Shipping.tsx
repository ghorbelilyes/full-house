import { CheckboxField } from '@components/common/form/CheckboxField.js';
import { NumberField } from '@components/common/form/NumberField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

interface ShippingProps {
  product:
    | {
        noShippingRequired: boolean;
        weight: {
          value: number;
          unit: string;
        };
      }
    | undefined;
  setting: {
    weightUnit: string;
  };
}
export default function Shipping({ product, setting }: ShippingProps) {
  const shipping = product || {
    noShippingRequired: undefined,
    weight: undefined
  };
  const { control } = useFormContext();
  const noShippingRequired = useWatch({
    control,
    name: 'no_shipping_required',
    defaultValue:
      (shipping.noShippingRequired !== null && shipping.noShippingRequired) ||
      false
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expédition</CardTitle>
        <CardDescription>
          Gérer les paramètres d'expédition du produit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CheckboxField
          name="no_shipping_required"
          label="Aucune expédition requise ?"
          defaultValue={shipping.noShippingRequired === true}
          helperText="Sélectionnez cette option si le produit est un produit numérique ou un service qui ne nécessite pas d'expédition."
          wrapperClassName="mb-0"
        />
      </CardContent>
      <CardContent>
        {!noShippingRequired && (
          <NumberField
            name="weight"
            placeholder="Entrez le poids"
            label={`Poids`}
            defaultValue={shipping.weight?.value}
            unit={setting?.weightUnit}
            required
            validation={{
              min: {
                value: 0,
                message: 'Le poids doit être un nombre positif'
              }
            }}
            helperText={'Le poids doit être un nombre positif'}
          />
        )}
        {noShippingRequired && (
          <NumberField
            name="weight_no_shipping"
            placeholder="Entrez le poids"
            label={`Poids`}
            defaultValue={shipping.weight?.value}
            unit={setting?.weightUnit}
            disabled
            helperText={'Weight must be a positive number'}
          />
        )}
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 15
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      weight {
        value
        unit
      }
      noShippingRequired
    }
    setting {
      weightUnit
    }
  }
`;
