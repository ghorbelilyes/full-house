import Area from '@components/common/Area.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { ChevronRight, Grid3x3, ShoppingBag } from 'lucide-react';
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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-200 hover:shadow-lg"
    >
      {/* Image / placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-50 to-white">
        {category.image?.url ? (
          <img
            src={category.image.url}
            alt={category.image.alt || category.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Grid3x3
              className="h-12 w-12 text-slate-200"
              strokeWidth={1}
            />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>

      {/* Label */}
      <div className="flex flex-1 flex-col items-start justify-center px-4 py-3.5">
        <h3 className="text-sm font-bold text-slate-800 transition-colors group-hover:text-primary sm:text-base">
          {category.name}
        </h3>
        {category.children && category.children.length > 0 && (
          <p className="mt-0.5 text-xs text-slate-400">
            {category.children.length}{' '}
            {category.children.length === 1
              ? _('sous-catégorie')
              : _('sous-catégories')}
          </p>
        )}
      </div>

      {/* Arrow indicator */}
      <div className="absolute bottom-3.5 right-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all duration-200 group-hover:bg-primary group-hover:text-white">
        <ChevronRight className="h-3.5 w-3.5" />
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
        <h2 className="text-xl font-bold text-slate-800">
          {category.name}
        </h2>
        <div className="h-px flex-1 bg-slate-200" />
        <a
          href={category.url}
          className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-brand-strong"
        >
          {_('Voir tout')}
          <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
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
  const topLevel = allCategories.filter((c) => !c.parent);
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
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-primary">
            <ShoppingBag className="h-3.5 w-3.5" />
            {_('Catalogue')}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
            {_('Boutique')}
          </h1>
          <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-primary" />
          <p className="mt-3 text-sm text-slate-500">
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
                <h2 className="text-xl font-bold text-slate-800">
                  {_('Autres catégories')}
                </h2>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
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
