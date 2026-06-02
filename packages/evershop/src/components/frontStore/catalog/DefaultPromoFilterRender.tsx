import React from 'react';
import { useProductFilter } from '@components/frontStore/catalog/ProductFilter.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';

interface PromoFilterProps {
  currentFilters: Array<{ key: string; value: string; operation: string }>;
}

export function DefaultPromoFilterRender({ currentFilters }: PromoFilterProps) {
  const { updateFilter } = useProductFilter();
  const isPromoActive = currentFilters.some(
    (f) => f.key === 'promo' && f.value === '1'
  );

  const togglePromo = () => {
    if (isPromoActive) {
      // Remove promo filter
      const newFilters = currentFilters.filter((f) => f.key !== 'promo');
      updateFilter(newFilters);
    } else {
      // Add promo filter
      const newFilters = [
        ...currentFilters.filter((f) => f.key !== 'promo'),
        { key: 'promo', operation: 'eq', value: '1' }
      ];
      updateFilter(newFilters);
    }
  };

  return (
    <div className="mb-5">
      <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
        {_('Promotions')}
      </h4>
      <label className="group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-orange-50 dark:hover:bg-slate-700/40">
        <span
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150 ${
            isPromoActive
              ? 'border-orange-500 bg-orange-500'
              : 'border-slate-300 bg-white group-hover:border-orange-300 dark:border-slate-600 dark:bg-slate-800'
          }`}
          onClick={togglePromo}
        >
          {isPromoActive && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        <span
          className={`text-[13px] transition-colors ${
            isPromoActive
              ? 'font-semibold text-orange-600'
              : 'font-medium text-slate-700 dark:text-slate-300'
          }`}
          onClick={togglePromo}
        >
          {_('Promo only')}
        </span>
      </label>
    </div>
  );
}
