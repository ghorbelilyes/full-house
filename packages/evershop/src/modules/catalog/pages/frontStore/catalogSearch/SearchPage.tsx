import Area from '@components/common/Area.js';
import { useAppDispatch } from '@components/common/context/app.js';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@components/common/ui/Sheet.js';
import { SearchCategorySidebar } from '@components/frontStore/catalog/SearchCategorySidebar.js';
import {
  SearchPageData,
  SearchProvider
} from '@components/frontStore/catalog/SearchContext.js';
import { SearchInfo } from '@components/frontStore/catalog/SearchInfo.js';
import { SearchProducts } from '@components/frontStore/catalog/SearchProducts.js';
import { SearchProductsFilter } from '@components/frontStore/catalog/SearchProductsFilter.js';
import { SearchProductsPagination } from '@components/frontStore/catalog/SearchProductsPagination.js';
import {
  SearchSorting,
  searchSortPresets,
  getCurrentPresetKey
} from '@components/frontStore/catalog/SearchSorting.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { ArrowUpDown, Check, LayoutGrid } from 'lucide-react';
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

      {/* ── Mobile toolbar ── */}
      <div className="page-width lg:hidden mb-5 flex items-center gap-2">
        {/* Categories drawer */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all active:scale-[0.98] hover:border-primary hover:shadow-md"
        >
          <LayoutGrid className="h-4 w-4 flex-shrink-0 text-slate-500" />
          <span>{_('Categories')}</span>
        </button>

        {/* Filters */}
        <div className="flex-shrink-0">
          <SearchProductsFilter categories={filterCategories} />
        </div>

        {/* Sort */}
        <div className="relative ml-auto" ref={sortDropdownRef}>
          <button
            type="button"
            onClick={() => setMobileSortOpen(!mobileSortOpen)}
            className={`flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2.5 text-sm font-medium shadow-sm transition-all active:scale-[0.98] ${
              currentSortKey
                ? 'border-primary text-primary'
                : 'border-slate-200 text-slate-700 hover:border-primary'
            }`}
            aria-label={_('Sort By')}
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden min-[480px]:inline">
              {currentSortKey
                ? searchSortPresets.find((p) => p.key === currentSortKey)?.label
                : _('Sort')}
            </span>
          </button>

          {mobileSortOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-slate-100 bg-white py-1 shadow-xl">
              {searchSortPresets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleMobileSort(preset)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                    currentSortKey === preset.key
                      ? 'bg-brand-soft font-semibold text-primary'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex-1 text-left">{preset.label}</span>
                  {currentSortKey === preset.key && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile category drawer ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] max-w-sm p-0"
        >
          <SheetHeader className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm">
            <SheetTitle className="flex items-center gap-2.5 text-base font-bold text-slate-800">
              <LayoutGrid className="h-5 w-5 text-primary" />
              {_('Categories')}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            <SearchCategorySidebar categoryTree={categoryTree} showHeader={false} showSeparator={false} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Main layout ── */}
      <div className="page-width grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
        {/* Desktop sidebar */}
        <Area
          id="searchLeftColumn"
          className="hidden lg:block h-fit space-y-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:sticky lg:top-[120px]"
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

        {/* Main content */}
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
