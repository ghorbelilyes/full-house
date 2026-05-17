import { PageHeading } from '@components/admin/PageHeading.js';
import React from 'react';

export default function DashboardPageHeading() {
  return <PageHeading heading="Tableau de bord" />;
}

export const layout = {
  areaId: 'content',
  sortOrder: 5
};
