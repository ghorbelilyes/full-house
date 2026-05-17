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
  if (!breadcrumbs.length) return null;

  return (
    <div className="page-width">
      <nav
        aria-label="breadcrumb"
        className="breadcrumbs-nav"
      >
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <React.Fragment key={index}>
              {isLast ? (
                <strong className="breadcrumbs-nav__current">
                  {breadcrumb.title}
                </strong>
              ) : (
                <a
                  href={breadcrumb.url}
                  className="breadcrumbs-nav__link"
                >
                  {index === 0 && <Home className="breadcrumbs-nav__home-icon" />}
                  {breadcrumb.title}
                </a>
              )}
              {!isLast && (
                <span className="breadcrumbs-nav__separator" aria-hidden="true">›</span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .breadcrumbs-nav {
              position: sticky;
              top: var(--header-h, 132px);
              z-index: 50;
              min-height: 52px;
              display: flex;
              align-items: center;
              gap: 9px;
              margin: 16px 0 16px;
              padding: 12px 16px;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              background: #fff;
              color: #94a3b8;
              font-size: 13px;
              box-shadow: 0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
            }
            .breadcrumbs-nav__link {
              color: #64748b;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              gap: 5px;
              transition: color 0.2s ease;
            }
            .breadcrumbs-nav__link:hover {
              color: var(--brand, #ff5b00);
            }
            .breadcrumbs-nav__home-icon {
              width: 14px;
              height: 14px;
            }
            .breadcrumbs-nav__separator {
              color: #cbd5e1;
              font-size: 15px;
              line-height: 1;
              user-select: none;
            }
            .breadcrumbs-nav__current {
              color: var(--brand, #ff5b00);
              font-weight: 850;
            }
            [data-theme="dark"] .breadcrumbs-nav,
            .dark .breadcrumbs-nav {
              background: #1e293b;
              border-color: #334155;
              color: #94a3b8;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            [data-theme="dark"] .breadcrumbs-nav__link,
            .dark .breadcrumbs-nav__link {
              color: #94a3b8;
            }
            [data-theme="dark"] .breadcrumbs-nav__separator,
            .dark .breadcrumbs-nav__separator {
              color: #475569;
            }
            @media (max-width: 640px) {
              .breadcrumbs-nav {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                padding: 12px 14px;
                min-height: 54px;
              }
              .breadcrumbs-nav__current {
                overflow: hidden;
                text-overflow: ellipsis;
              }
            }
          `
        }}
      />
    </div>
  );
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
