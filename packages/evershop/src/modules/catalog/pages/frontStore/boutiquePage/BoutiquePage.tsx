import Area from '@components/common/Area.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

interface CategoryItem {
  categoryId: number;
  uuid: string;
  name: string;
  url: string;
  image: { alt: string; url: string } | null;
  parent: { categoryId: number } | null;
  children: CategoryItem[];
}

interface BoutiquePageProps {
  categories: {
    items: CategoryItem[];
  };
}

/* ── Single category card ───────────────────────────── */
function CategoryCard({ category }: { category: CategoryItem }) {
  return (
    <a
      href={category.url}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-500"
    >
      {/* Image / placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-700 dark:to-slate-600">
        {category.image?.url ? (
          <img
            src={category.image.url}
            alt={category.image.alt || category.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-16 w-16 text-orange-300 dark:text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-4">
        <h3 className="text-center text-base font-semibold text-slate-800 group-hover:text-orange-600 transition-colors dark:text-slate-100 dark:group-hover:text-orange-400">
          {category.name}
        </h3>
        {category.children && category.children.length > 0 && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {category.children.length}{' '}
            {category.children.length === 1
              ? _('sous-catégorie')
              : _('sous-catégories')}
          </p>
        )}
      </div>
    </a>
  );
}

/* ── Category group (parent + children) ────────────── */
function CategoryGroup({ category }: { category: CategoryItem }) {
  const hasChildren = category.children && category.children.length > 0;

  return (
    <section className="mb-10">
      {/* Parent heading */}
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {category.name}
        </h2>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <a
          href={category.url}
          className="flex-shrink-0 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
        >
          {_('Voir tout')} →
        </a>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {hasChildren ? (
          category.children.map((child) => (
            <CategoryCard key={child.categoryId} category={child} />
          ))
        ) : (
          <CategoryCard category={category} />
        )}
      </div>
    </section>
  );
}

/* ── Page component ────────────────────────────────── */
export default function BoutiquePage({ categories }: BoutiquePageProps) {
  const allCategories = categories?.items || [];
  // Only show root-level categories (those without a parent)
  const topLevel = allCategories.filter((c) => !c.parent);

  // Separate root categories (those with children) vs leaf categories
  const rootWithChildren = topLevel.filter(
    (c) => c.children && c.children.length > 0
  );
  const rootLeaf = topLevel.filter(
    (c) => !c.children || c.children.length === 0
  );

  return (
    <>
      <Area id="boutiquePageTop" className="boutique__page__top" />

      <div className="page-width py-8">
        {/* Page heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {_('Boutique')}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {_('Parcourez toutes nos catégories')}
          </p>
        </div>

        {/* Root categories that have children → rendered as groups */}
        {rootWithChildren.map((cat) => (
          <CategoryGroup key={cat.categoryId} category={cat} />
        ))}

        {/* Root leaf categories → rendered in a single grid */}
        {rootLeaf.length > 0 && (
          <section className="mb-10">
            {rootWithChildren.length > 0 && (
              <div className="mb-5 flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {_('Autres catégories')}
                </h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {rootLeaf.map((cat) => (
                <CategoryCard key={cat.categoryId} category={cat} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Area id="boutiquePageBottom" className="boutique__page__bottom" />
    </>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    categories(filters: [{key: "status", operation: eq, value: "1"}]) {
      items {
        categoryId
        uuid
        name
        url
        parent {
          categoryId
        }
        image {
          alt
          url
        }
        children {
          categoryId
          uuid
          name
          url
          image {
            alt
            url
          }
          children {
            categoryId
            uuid
            name
            url
            image {
              alt
              url
            }
            children {
              categoryId
              uuid
              name
              url
              image {
                alt
                url
              }
              children {
                categoryId
                uuid
                name
                url
              }
            }
          }
        }
      }
    }
  }
`;
