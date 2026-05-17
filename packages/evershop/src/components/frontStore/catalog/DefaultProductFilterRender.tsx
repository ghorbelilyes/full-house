import Area from '@components/common/Area.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '@components/common/ui/Sheet.js';
import { DefaultAttributeFilterRender } from '@components/frontStore/catalog/DefaultAttributeFilterRender.js';
import { DefaultCategoryFilterRender } from '@components/frontStore/catalog/DefaultCategoryFilterRender.js';
import { DefaultPriceFilterRender as PriceFilterRenderer } from '@components/frontStore/catalog/DefaultPriceFilterRender.js';
import { DefaultProductFilterSummary } from '@components/frontStore/catalog/DefaultProductFilterSummary.js';
import {
  ProductFilterRenderProps,
  FilterComponent,
  ProductFilterDispatch
} from '@components/frontStore/catalog/ProductFilter.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { useState, useMemo } from 'react';
import React from 'react';

export const DefaultProductFilterRender: React.FC<{
  renderProps: ProductFilterRenderProps;
  className?: string;
  title?: string;
  showFilterSummary?: boolean;
}> = ({
  renderProps,
  className = '',
  title = _('Product Filters'),
  showFilterSummary = true
}) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const {
    currentFilters,
    availableAttributes,
    priceRange,
    categories,
    setting,
    removeFilter,
    updateFilter,
    clearAllFilters,
    isLoading,
    activeFilterCount
  } = renderProps;

  const defaultComponents = useMemo(() => {
    const components: FilterComponent[] = [];

    if (priceRange && priceRange.min !== priceRange.max) {
      components.push({
        component: { default: PriceFilterRenderer },
        props: { priceRange, currentFilters, setting },
        sortOrder: 10,
        id: 'priceFilter'
      });
    }

    if (categories.length > 0) {
      components.push({
        component: { default: DefaultCategoryFilterRender },
        props: { categories, currentFilters },
        sortOrder: 15,
        id: 'categoryFilter'
      });
    }

    if (availableAttributes.length > 0) {
      components.push({
        component: { default: DefaultAttributeFilterRender },
        props: { availableAttributes, currentFilters },
        sortOrder: 20,
        id: 'attributeFilter'
      });
    }

    return components;
  }, [availableAttributes, priceRange, categories, currentFilters, setting]);

  const contextValue = useMemo(
    () => ({ updateFilter, removeFilter, clearAllFilters }),
    [updateFilter, removeFilter, clearAllFilters]
  );

  return (
    <ProductFilterDispatch.Provider value={contextValue}>
      <button
        onClick={() => setIsMobileFilterOpen(true)}
        className="lg:hidden flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all active:scale-[0.98] hover:border-orange-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-orange-500"
      >
        <svg
          className="h-[18px] w-[18px] flex-shrink-0 text-orange-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0111 21v-6.586a1 1 0 00-.293-.707L4.293 7.293A1 1 0 014 6.586V4z"
          />
        </svg>
        <span className="flex-1 text-left">{_('Filters')}</span>
        {activeFilterCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
        <SheetContent
          side="bottom"
          className="lg:hidden max-h-[85vh] border-border"
        >
          <SheetHeader>
            <SheetTitle>{_('Filters')}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {showFilterSummary && (
              <DefaultProductFilterSummary
                availableAttributes={availableAttributes}
                currentFilters={currentFilters}
                priceRange={priceRange}
                categories={categories}
              />
            )}

            <div className={isLoading ? 'opacity-75 pointer-events-none' : ''}>
              <Area
                id="productFilter"
                noOuter
                coreComponents={defaultComponents}
                availableAttributes={availableAttributes}
                priceRange={priceRange}
                currentFilters={currentFilters}
                categories={categories}
                setting={setting}
              />
            </div>
          </div>

          <SheetFooter className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={clearAllFilters}
              disabled={isLoading || activeFilterCount === 0}
              className="flex-1"
            >
              {_('Clear All')}
            </Button>
            <Button
              variant="default"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              {_('Apply Filters')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className={`hidden lg:block product__filters ${className}`}>
        {/* Collapsible filter header */}
        <button
          type="button"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="group mb-1 flex w-full items-center justify-between rounded-xl px-1 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
        >
          <span className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">
            {title}
          </span>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                {activeFilterCount}
              </span>
            )}
            <svg
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 ${
                isFilterOpen ? '' : '-rotate-90'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {isFilterOpen && (
          <div className="mt-1">
            {activeFilterCount > 0 && (
              <div className="mb-3 flex items-center justify-end">
                <button
                  onClick={clearAllFilters}
                  disabled={isLoading}
                  className="text-xs text-slate-500 transition-colors hover:text-orange-500 disabled:opacity-50 dark:text-slate-400 dark:hover:text-orange-400"
                >
                  {_('Clear All')}
                </button>
              </div>
            )}

            {showFilterSummary && (
              <DefaultProductFilterSummary
                availableAttributes={availableAttributes}
                currentFilters={currentFilters}
                priceRange={priceRange}
                categories={categories}
              />
            )}

            <div className={isLoading ? 'opacity-75 pointer-events-none' : ''}>
              <Area
                id="productFilter"
                noOuter
                coreComponents={defaultComponents}
                availableAttributes={availableAttributes}
                priceRange={priceRange}
                currentFilters={currentFilters}
                categories={categories}
                setting={setting}
              />
            </div>
          </div>
        )}
      </div>
    </ProductFilterDispatch.Provider>
  );
};
