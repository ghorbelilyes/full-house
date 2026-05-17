import Area from '@components/common/Area.js';
import { Editor, Row } from '@components/common/form/Editor.js';
import { InputField } from '@components/common/form/InputField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import './General.scss';
import React from 'react';

interface GeneralProps {
  collection?: {
    collectionId?: string;
    name?: string;
    code?: string;
    description?: Row[];
  };
}

export default function General({ collection }: GeneralProps) {
  const fields = [
    {
      component: {
        default: (
          <InputField
            name="name"
            label="Nom de la collection"
            placeholder="Entrer le nom de la collection"
            defaultValue={collection?.name || ''}
            required
          />
        )
      },
      sortOrder: 10,
      id: 'name'
    },
    {
      component: {
        default: (
          <InputField
            name="code"
            label="Code de la collection"
            defaultValue={collection?.code || ''}
            required
            validation={{
              required: 'Le code de la collection est requis',
              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,
                message:
                  'Le code de la collection doit être alphanumérique et peut inclure des tirets ou des underscores.'
              }
            }}
            placeholder="Code de la collection"
          />
        )
      },
      sortOrder: 15,
      id: 'code'
    },
    {
      component: {
        default: (
          <Editor
            name="description"
            label="Description"
            value={collection?.description || []}
          />
        )
      },
      sortOrder: 30
    }
  ];

  return (
    <Card title="General">
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
        <CardDescription>
          Gérer les informations générales de la collection.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Area
          id="collectionEditGeneral"
          coreComponents={fields}
          className="space-y-2"
        />
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'collectionFormInner',
  sortOrder: 10
};

export const query = `
  query Query {
    collection(code: getContextValue("collectionCode", null)) {
      collectionId
      name
      code
      description
    }
  }
`;
