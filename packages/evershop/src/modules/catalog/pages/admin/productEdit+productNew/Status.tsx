import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface StatusProps {
  product:
    | {
        status: number;
        visibility: number;
      }
    | undefined;
}
export default function Status({ product }: StatusProps) {
  return (
    <Card className="bg-popover">
      <CardHeader>
        <CardTitle>Statut du Produit</CardTitle>
        <CardDescription>
          Définir le statut et la visibilité du produit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroupField
          name="status"
          label="Statut"
          options={[
            { value: 0, label: 'Désactivé' },
            { value: 1, label: 'Activé' }
          ]}
          defaultValue={product?.status === 0 ? 0 : 1}
          required
          helperText="Les produits désactivés ne seront pas visibles dans la boutique et ne pourront pas être achetés."
        />
      </CardContent>
      <CardContent className="border-t border-t-border pt-6">
        <RadioGroupField
          name="visibility"
          label="Visibilité"
          options={[
            { value: 0, label: 'Non visible individuellement' },
            { value: 1, label: 'Catalogue, Recherche' }
          ]}
          defaultValue={product?.visibility === 0 ? 0 : 1}
          required
          helperText="La visibilité détermine où le produit apparaît dans la boutique. Elle n'affecte pas la possibilité de vendre le produit."
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 10
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      status
      visibility
      category {
        value: categoryId
        label: name
      }
    }
  }
`;
