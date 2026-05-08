import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@components/common/ui/Breadcrumb.js';
import { Home } from 'lucide-react';
import React from 'react';

interface BreadcrumbProps {
  pageInfo: {
    breadcrumbs: Array<{
      title: string;
      url: string;
    }>;
  };
}

function Breadcrumb({ pageInfo: { breadcrumbs } }: BreadcrumbProps) {
  return breadcrumbs.length ? (
    <div className="page-width">
      <div className="py-4">
        <BreadcrumbRoot>
          <BreadcrumbList className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2.5 text-sm border border-slate-100">
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage className="font-semibold text-orange-500">
                      {breadcrumb.title}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={breadcrumb.url}
                      className="flex items-center gap-1.5 text-slate-500 transition-colors hover:text-orange-500"
                    >
                      {index === 0 && <Home className="h-3.5 w-3.5" />}
                      {breadcrumb.title}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator className="text-slate-300 [&>svg]:size-3.5" />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </BreadcrumbRoot>
      </div>
    </div>
  ) : null;
}

export const query = `
  query query {
    pageInfo {
      breadcrumbs {
        title
        url
      }
    }
  }
`;

export const layout = {
  areaId: 'content',
  sortOrder: 0
};

export default Breadcrumb;
