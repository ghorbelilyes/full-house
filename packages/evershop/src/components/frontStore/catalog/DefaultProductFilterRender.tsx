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
import { DefaultPriceFilterRender as PriceFilterRenderer } from '@components/frontStore/catalog/DefaultPriceFilterRender.js';
import { DefaultProductFilterSummary } from '@components/frontStore/catalog/DefaultProductFilterSummary.js';
import { DefaultPromoFilterRender } from '@components/frontStore/catalog/DefaultPromoFilterRender.js';
import {
  ProductFilterRenderProps,
  FilterComponent,
  ProductFilterDispatch
} from '@components/frontStore/catalog/ProductFilter.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
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

  const {
    currentFilters,
    availableAttributes,
    priceRange,
    categories,
    setting,
    removeFilter,
    removeFilterValue,
    updateFilter,
    clearAllFilters,
    isLoading,
    activeFilterCount
  } = renderProps;

  const defaultComponents = useMemo(() => {
    const components: FilterComponent[] = [];

    components.push({
      component: { default: DefaultPromoFilterRender },
      props: { currentFilters },
      sortOrder: 5,
      id: 'promoFilter'
    });

    if (priceRange && priceRange.min !== priceRange.max) {
      components.push({
        component: { default: PriceFilterRenderer },
        props: { priceRange, currentFilters, setting },
        sortOrder: 10,
        id: 'priceFilter'
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

  const handleRemoveFilter = (key: string, value?: string) => {
    if (key === 'price') {
      const newFilters = currentFilters.filter(
        (f) => f.key !== 'min_price' && f.key !== 'max_price'
      );
      updateFilter(newFilters);
    } else if (value) {
      removeFilterValue(key, value);
    } else {
      removeFilter(key);
    }
  };

  /* Shared filter content */
  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {showFilterSummary && (
        <DefaultProductFilterSummary
          availableAttributes={availableAttributes}
          currentFilters={currentFilters}
          priceRange={priceRange}
          categories={categories}
          onRemoveFilter={handleRemoveFilter}
        />
      )}

      <div className={isLoading ? 'opacity-60 pointer-events-none' : ''}>
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
    </>
  );

  return (
    <ProductFilterDispatch.Provider value={contextValue}>
      {/* ── Mobile filter trigger ── */}
      <button
        onClick={() => setIsMobileFilterOpen(true)}
        className="lg:hidden flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all active:scale-[0.98] hover:border-primary hover:shadow-md"
      >
        <SlidersHorizontal className="h-4 w-4 flex-shrink-0 text-primary" />
        <span className="flex-1 text-left">{_('Filters')}</span>
        {activeFilterCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* ── Mobile filter bottom sheet ── */}
      <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
        <SheetContent
          side="bottom"
          className="lg:hidden max-h-[85vh] border-border"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              {_('Filters')}
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <FilterContent isMobile />
          </div>

          <SheetFooter className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={clearAllFilters}
              disabled={isLoading || activeFilterCount === 0}
              className="flex-1 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {_('Clear All')}
            </Button>
            <Button
              variant="default"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              {_('Show Results')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Desktop filter sidebar ── */}
      <div className={`hidden lg:block product__filters ${className}`}>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            {title}
          </h3>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-red-500 disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              {_('Clear All')}
            </button>
          )}
        </div>

        <FilterContent />
      </div>
    </ProductFilterDispatch.Provider>
  );
};
