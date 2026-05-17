import Area from '@components/common/Area.js';
import { InputField } from '@components/common/form/InputField.js';
import { TextareaField } from '@components/common/form/TextareaField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface CategorySeoProps {
  category?: {
    urlKey?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
}
export default function Seo({ category }: CategorySeoProps) {
  const fields = [
    {
      component: {
        default: (
          <InputField
            name="url_key"
            label="Clé URL"
            placeholder="Entrer la clé URL"
            defaultValue={category?.urlKey || ''}
            required
            validation={{
              required: 'La clé URL est requise',
              pattern: {
                value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message:
                  'La clé URL doit être en minuscules et ne peut contenir que des caractères alphanumériques et des tirets'
              }
            }}
          />
        )
      },
      sortOrder: 0
    },
    {
      component: {
        default: (
          <InputField
            name="meta_title"
            label="Titre méta"
            placeholder="Entrer le titre méta"
            defaultValue={category?.metaTitle || ''}
            required
            validation={{
              required: 'Le titre méta est requis'
            }}
          />
        )
      },
      sortOrder: 10
    },
    {
      component: {
        default: (
          <TextareaField
            name="meta_description"
            label="Description méta"
            placeholder="Entrer la description méta"
            defaultValue={category?.metaDescription || ''}
            required
            validation={{
              required: 'La description méta est requise'
            }}
          />
        )
      },
      sortOrder: 30
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Référencement (SEO)</CardTitle>
        <CardDescription>
          Gérer les paramètres SEO de la catégorie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Area
          id="categoryEditSeo"
          coreComponents={fields}
          className="space-y-2"
        />
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 60
};

export const query = `
  query Query {
    category(id: getContextValue('categoryId', null)) {
      urlKey
      metaTitle
      metaKeywords
      metaDescription
    }
  }
`;
