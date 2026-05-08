import { PageHeading } from '@components/admin/PageHeading.js';
import React from 'react';

export default function CmsPageHeading() {
  return <PageHeading heading="Pages CMS" />;
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
