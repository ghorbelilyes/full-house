import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

export interface CategoryStatusProps {
  category?: {
    status?: number;
    includeInNav?: number;
    showProducts?: number;
  };
}

export default function Status({ category }: CategoryStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statut</CardTitle>
        <CardDescription>
          Gérer les paramètres de statut de la catégorie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroupField
          name="status"
          label="Statut"
          options={[
            { label: 'Désactivé', value: 0 },
            { label: 'Activé', value: 1 }
          ]}
          defaultValue={category?.status === 0 ? 0 : 1}
          validation={{
            required: 'Ce champ est requis'
          }}
        />
      </CardContent>
      <CardContent className="pt-6 border-t border-border">
        <RadioGroupField
          name="include_in_nav"
          label="Inclure dans le menu du site ?"
          options={[
            { label: 'Non', value: 0 },
            { label: 'Oui', value: 1 }
          ]}
          defaultValue={category?.includeInNav === 0 ? 0 : 1}
          validation={{
            required: 'Ce champ est requis'
          }}
        />
      </CardContent>
      <CardContent className="pt-6 border-t border-border">
        <RadioGroupField
          name="show_products"
          label="Afficher les produits ?"
          options={[
            { label: 'Non', value: 0 },
            { label: 'Oui', value: 1 }
          ]}
          defaultValue={category?.showProducts === 0 ? 0 : 1}
          validation={{
            required: 'Ce champ est requis'
          }}
        />
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
    category(id: getContextValue("categoryId", null)) {
      status
      includeInNav
      showProducts
    }
  }
`;
