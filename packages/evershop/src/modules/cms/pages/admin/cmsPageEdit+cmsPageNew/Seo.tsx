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

interface CmsPageSeoProps {
  page?: {
    urlKey?: string;
    metaTitle?: string;
    metaKeywords?: string;
    metaDescription?: string;
  };
}

export default function Seo({ page }: CmsPageSeoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations SEO</CardTitle>
        <CardDescription>
          Fournir les détails SEO de la page CMS.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <InputField
            id="urlKey"
            name="url_key"
            label="Clé URL"
            placeholder="Entrer la clé URL"
            defaultValue={page?.urlKey}
            required
            validation={{ required: 'La clé URL est requise' }}
            helperText="C'est le chemin URL de la page CMS."
          />

          <InputField
            id="metaTitle"
            name="meta_title"
            label="Titre méta"
            placeholder="Entrer le titre méta"
            defaultValue={page?.metaTitle}
            required
            validation={{ required: 'Le titre méta est requis' }}
            helperText="C'est le titre méta de la page CMS."
          />

          <TextareaField
            name="meta_description"
            label="Description méta"
            placeholder="Entrer la description méta"
            defaultValue={page?.metaDescription}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'wideScreen',
  sortOrder: 30
};

export const query = `
  query Query {
    page: cmsPage(id: getContextValue('cmsPageId', null)) {
      urlKey
      metaTitle
      metaKeywords
      metaDescription
    }
  }
`;
