import { useProductFilter } from '@components/frontStore/catalog/ProductFilter.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { Tag } from 'lucide-react';
import React from 'react';

interface PromoFilterProps {
  currentFilters: Array<{ key: string; value: string; operation: 'eq' | 'in' | 'range' | 'gt' | 'lt' }>;
}

export function DefaultPromoFilterRender({ currentFilters }: PromoFilterProps) {
  const { updateFilter } = useProductFilter();
  const isPromoActive = currentFilters.some(
    (f) => f.key === 'promo' && f.value === '1'
  );

  const togglePromo = () => {
    if (isPromoActive) {
      const newFilters = currentFilters.filter((f) => f.key !== 'promo');
      updateFilter(newFilters);
    } else {
      const newFilters = [
        ...currentFilters.filter((f) => f.key !== 'promo'),
        { key: 'promo', operation: 'eq' as const, value: '1' }
      ];
      updateFilter(newFilters);
    }
  };

  return (
    <div className="border-b border-slate-100 pb-4 mb-4">
      <button
        type="button"
        className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150 ${
          isPromoActive
            ? 'border border-primary bg-brand-soft shadow-sm'
            : 'border border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white'
        }`}
        onClick={togglePromo}
      >
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
            isPromoActive
              ? 'bg-primary text-white'
              : 'bg-white text-slate-400 group-hover:text-primary'
          }`}
        >
          <Tag className="h-4 w-4" />
        </div>
        <span
          className={`text-[13px] font-semibold transition-colors ${
            isPromoActive
              ? 'text-primary'
              : 'text-slate-700'
          }`}
        >
          {_('Promo only')}
        </span>
        {/* Toggle indicator */}
        <div
          className={`ml-auto h-5 w-9 rounded-full p-0.5 transition-colors ${
            isPromoActive ? 'bg-primary' : 'bg-slate-200'
          }`}
        >
          <div
            className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              isPromoActive ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
      </button>
    </div>
  );
}
