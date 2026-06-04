import { useProductFilter } from '@components/frontStore/catalog/ProductFilter.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

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
      <button
        type="button"
        className="group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-brand-soft dark:hover:bg-slate-700/40"
        onClick={togglePromo}
      >
        <span
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150 ${
            isPromoActive
              ? 'border-primary bg-primary'
              : 'border-slate-300 bg-white group-hover:border-brand-muted dark:border-slate-600 dark:bg-slate-800'
          }`}
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
              ? 'font-semibold text-primary'
              : 'font-medium text-slate-700 dark:text-slate-300'
          }`}
        >
          {_('Promo only')}
        </span>
      </button>
    </div>
  );
}
