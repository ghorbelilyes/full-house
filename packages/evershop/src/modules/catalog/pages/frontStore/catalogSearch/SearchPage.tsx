import Area from '@components/common/Area.js';
import {
  SearchPageData,
  SearchProvider
} from '@components/frontStore/catalog/SearchContext.js';
import { SearchInfo } from '@components/frontStore/catalog/SearchInfo.js';
import { SearchProducts } from '@components/frontStore/catalog/SearchProducts.js';
import { SearchProductsPagination } from '@components/frontStore/catalog/SearchProductsPagination.js';
import {
  SearchSorting,
  searchSortPresets,
  getCurrentPresetKey
} from '@components/frontStore/catalog/SearchSorting.js';
import { SearchCategorySidebar } from '@components/frontStore/catalog/SearchCategorySidebar.js';
import { SearchProductsFilter } from '@components/frontStore/catalog/SearchProductsFilter.js';
import { useAppDispatch } from '@components/common/context/app.js';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@components/common/ui/Sheet.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { ArrowUpDown, Check } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';

interface SidebarCategoryItem {
  categoryId?: number | null;
  name: string;
  url: string;
  type?: string | null;
  uuid?: string | null;
  children?: SidebarCategoryItem[];
}

interface SearchPageProps {
  search: SearchPageData;
  menu: {
    items: SidebarCategoryItem[];
  };
}

function collectCategoryMenuItems(items: SidebarCategoryItem[]): SidebarCategoryItem[] {
  return items.reduce<SidebarCategoryItem[]>((result, item) => {
    const children = collectCategoryMenuItems(item.children || []);
    if (item.categoryId || children.length > 0) {
      result.push({ ...item, children });
    }
    return result;
  }, []);
}

function collectMenuCategories(items: SidebarCategoryItem[]) {
  const categories: { categoryId: number; name: string; uuid: string }[] = [];
  const seen = new Set<number>();
  const collect = (nodes: SidebarCategoryItem[]) => {
    nodes.forEach((node) => {
      if (node.categoryId && !seen.has(node.categoryId)) {
        seen.add(node.categoryId);
        categories.push({
          categoryId: node.categoryId,
          name: node.name,
          uuid: node.uuid || node.categoryId.toString()
        });
      }
      if (node.children && node.children.length > 0) {
        collect(node.children);
      }
    });
  };
  collect(items);
  return categories;
}

export default function SearchPage({ search, menu }: SearchPageProps) {
  const categoryTree = collectCategoryMenuItems(menu?.items || []);
  const filterCategories = collectMenuCategories(categoryTree);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const AppContextDispatch = useAppDispatch();

  const [currentSortKey, setCurrentSortKey] = useState<string>(getCurrentPresetKey);

  const handleMobileSort = useCallback(async (preset: typeof searchSortPresets[0]) => {
    setCurrentSortKey(preset.key);
    setMobileSortOpen(false);
    const url = new URL(window.location.href, window.location.origin);
    if (preset.ob) {
      url.searchParams.set('ob', preset.ob);
    } else {
      url.searchParams.delete('ob');
    }
    if (preset.od && preset.od !== 'asc') {
      url.searchParams.set('od', preset.od);
    } else {
      url.searchParams.delete('od');
    }
    url.searchParams.delete('page');
    url.searchParams.append('ajax', 'true');
    await AppContextDispatch.fetchPageData(url);
    url.searchParams.delete('ajax');
    history.pushState(null, '', url);
  }, [AppContextDispatch]);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!mobileSortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setMobileSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileSortOpen]);

  return (
    <SearchProvider searchData={search}>
      <Area id="searchPageTop" className="search__page__top" />
      <SearchInfo />

      {/* ── Mobile: compact pill-style toolbar ── */}
      <div className="page-width lg:hidden mb-4 flex items-center gap-2">
        {/* Categories → left drawer */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all active:scale-[0.98] hover:border-orange-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-orange-500"
        >
          <svg
            className="h-[16px] w-[16px] flex-shrink-0 text-slate-600 dark:text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
          </svg>
          <span>{_('Shop')}</span>
        </button>

        {/* Filters → bottom sheet */}
        <div className="flex-shrink-0">
          <SearchProductsFilter categories={filterCategories} />
        </div>

        {/* Sort → simple dropdown */}
        <div className="relative ml-auto" ref={sortDropdownRef}>
          <button
            type="button"
            onClick={() => setMobileSortOpen(!mobileSortOpen)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all active:scale-[0.98] hover:border-orange-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-500"
            aria-label={_('Sort By')}
          >
            <ArrowUpDown className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
          </button>

          {mobileSortOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              {searchSortPresets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleMobileSort(preset)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-orange-400"
                >
                  <span className="flex-1 text-left">{preset.label}</span>
                  {currentSortKey === preset.key && (
                    <Check className="h-4 w-4 text-orange-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile category drawer (left side) ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] max-w-sm p-0"
        >
          <SheetHeader className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
            <SheetTitle className="flex items-center gap-2.5 text-base font-bold text-slate-800 dark:text-slate-100">
              <svg
                className="h-5 w-5 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
              </svg>
              {_('Categories')}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            <SearchCategorySidebar categoryTree={categoryTree} showHeader={false} showSeparator={false} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="page-width grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* ── Desktop sidebar (hidden on mobile) ── */}
        <Area
          id="searchLeftColumn"
          className="hidden lg:block h-fit space-y-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-[140px]"
          coreComponents={[
            {
              component: {
                default: (
                  <SearchCategorySidebar categoryTree={categoryTree} />
                )
              },
              sortOrder: 5,
              id: 'searchCategorySidebar'
            },
            {
              component: {
                default: (
                  <SearchProductsFilter categories={filterCategories} />
                )
              },
              sortOrder: 10,
              id: 'searchProductFilter'
            }
          ]}
        />

        {/* ── Main content ── */}
        <div>
          <SearchSorting />
          <SearchProducts />
          <SearchProductsPagination />
        </div>
      </div>
      <Area id="searchPageBottom" className="search__page__bottom" />
    </SearchProvider>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    search: productSearch {
      keyword
      products {
        items {
          ...Product
        }
        currentFilters {
          key
          operation
          value
        }
        total
      }
    }
    menu {
      items {
        name
        url
        type
        uuid
        categoryId
        children {
          name
          url
          type
          uuid
          categoryId
          children {
            name
            url
            type
            uuid
            categoryId
            children {
              name
              url
              type
              uuid
              categoryId
            }
          }
        }
      }
    }
}`;

export const fragments = `
  fragment Product on Product {
    productId
    name
    sku
    price {
      regular {
        value
        text
      }
      special {
        value
        text
      }
    }
    promotion {
      promotionType
      promotionValue
      promotionLabel
      isActive
      discountPercent
    }
    attributes: attributeIndex {
      attributeName
      attributeCode
      optionText
    }
    reviewSummary {
      averageRating
      totalReviews
    }
    inventory {
      isInStock
    }
    image {
      alt
      url
    }
    url
  }
`;
