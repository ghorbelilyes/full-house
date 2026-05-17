import { Editor, Row } from '@components/common/form/Editor.js';
import { InputField } from '@components/common/form/InputField.js';
import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface CmsPageGeneralProps {
  page?: {
    cmsPageId?: string;
    name?: string;
    status?: number;
    sortOrder?: number;
    content?: Row[];
  };
}

export default function General({ page }: CmsPageGeneralProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
        <CardDescription>
          Fournir les informations de base de la page CMS.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <InputField
              id="cms_page_name"
              name="name"
              label="Nom de la page"
              placeholder="Entrer le nom de la page"
              defaultValue={page?.name}
              required
              validation={{ required: 'Le nom de la page est requis' }}
              helperText="C'est le nom de la page CMS qui sera affiché dans le panneau d'administration."
            />
          </div>
          <div className="space-y-2">
            <RadioGroupField
              name="status"
              label="Statut"
              options={[
                { value: 1, label: 'Activé' },
                { value: 0, label: 'Désactivé' }
              ]}
              defaultValue={page?.status}
              required
              helperText="Activer cette page pour la rendre visible sur le site."
            />
          </div>
          <div>
            <label htmlFor="content" className="block mb-2 font-medium">
              Contenu
            </label>
            <Editor name="content" value={page?.content || []} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'wideScreen',
  sortOrder: 10
};

export const query = `
  query Query {
    page: cmsPage(id: getContextValue("cmsPageId", null)) {
      cmsPageId
      name
      status
      sortOrder
      content
    }
  }
`;
