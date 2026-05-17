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

interface SEOProps {
  product:
    | {
        urlKey: string;
        metaTitle: string;
        metaKeywords: string;
        metaDescription: string;
      }
    | undefined;
}
export default function SEO({ product }: SEOProps) {
  const fields = [
    {
      component: {
        default: (
          <InputField
            name="url_key"
            label="Clé URL"
            placeholder="Entrez la clé URL"
            required
            defaultValue={product?.urlKey}
            validation={{
              required: 'La clé URL est requise',
              pattern: {
                value: /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/,
                message:
                  'La clé URL doit être en minuscules et ne peut contenir que des lettres, des chiffres et des tirets'
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
            label="Méta Titre"
            placeholder="Entrez le méta titre"
            required
            defaultValue={product?.metaTitle}
            validation={{
              required: 'Le méta titre est requis'
            }}
          />
        )
      },
      sortOrder: 10
    },
    {
      component: {
        default: (
          <InputField
            type="hidden"
            name="meta_keywords"
            defaultValue={product?.metaKeywords}
          />
        )
      },
      sortOrder: 20
    },
    {
      component: {
        default: (
          <TextareaField
            name="meta_description"
            label="Méta Description"
            placeholder="Entrez la méta description"
            defaultValue={product?.metaDescription || ''}
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
        <CardDescription>Gérer les paramètres SEO.</CardDescription>
      </CardHeader>
      <CardContent>
        <Area
          id="productEditSeo"
          coreComponents={fields}
          className="flex flex-col gap-2"
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
    product(id: getContextValue('productId', null)) {
      urlKey
      metaTitle
      metaKeywords
      metaDescription
    }
  }
`;
