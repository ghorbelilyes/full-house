import { NavigationItemGroup } from '@components/admin/NavigationItemGroup.js';
import { FileText } from 'lucide-react';
import React from 'react';

export default function DocumentsMenuGroup({ documentTemplatesUrl }) {
  return (
    <NavigationItemGroup
      id="documentsMenuGroup"
      name="Documents"
      items={[
        {
          Icon: FileText,
          url: documentTemplatesUrl,
          title: 'Modèles de documents'
        }
      ]}
    />
  );
}

export const layout = {
  areaId: 'adminMenu',
  sortOrder: 35
};

export const query = `
  query Query {
    documentTemplatesUrl: url(routeId: "documentTemplates")
  }
`;
