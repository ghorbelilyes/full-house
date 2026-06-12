import {
  CategoryFilter,
  FilterableAttribute,
  FilterInput,
  PriceRange
} from '@components/frontStore/catalog/ProductFilter.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { X } from 'lucide-react';
import React from 'react';

export const formatPrice = (oldFormatted: string, price: number) => {
  const match = oldFormatted.match(/^[^\d.,]+/);
  const currencySymbol = match ? match[0] : '';
  return currencySymbol + price;
};

export const getFilterSummary = (
  availableAttributes,
  currentFilters,
  priceRange,
  categories
) => {
  const summaries: { label: string; key: string; value?: string }[] = [];

  const minPrice = currentFilters.find((f) => f.key === 'min_price');
  const maxPrice = currentFilters.find((f) => f.key === 'max_price');
  if (minPrice || maxPrice) {
    const min = minPrice?.value || priceRange?.min.toString() || '0';
    const max = maxPrice?.value || priceRange?.max.toString() || '∞';
    summaries.push({
      label: `${formatPrice(
        priceRange.minText,
        parseInt(min)
      )} – ${formatPrice(priceRange.maxText, parseInt(max))}`,
      key: 'price'
    });
  }

  const categoryFilter = currentFilters.find((f) => f.key === 'cat');
  if (categoryFilter) {
    const selectedCategoryIds = categoryFilter.value.split(',');
    const selectedCategories = categories.filter((cat) =>
      selectedCategoryIds.includes(cat.categoryId.toString())
    );
    selectedCategories.forEach((c) => {
      summaries.push({
        label: c.name,
        key: 'cat',
        value: c.categoryId.toString()
      });
    });
  }

  availableAttributes.forEach((attr) => {
    const filter = currentFilters.find((f) => f.key === attr.attributeCode);
    if (filter) {
      const selectedOptionIds = filter.value.split(',');
      const selectedOptions = attr.options.filter((opt) =>
        selectedOptionIds.includes(opt.optionId.toString())
      );
      selectedOptions.forEach((o) => {
        summaries.push({
          label: o.optionText,
          key: attr.attributeCode,
          value: o.optionId.toString()
        });
      });
    }
  });

  const promoFilter = currentFilters.find(
    (f) => f.key === 'promo' && f.value === '1'
  );
  if (promoFilter) {
    summaries.push({ label: _('Promo'), key: 'promo' });
  }

  return summaries;
};

export const DefaultProductFilterSummary: React.FC<{
  availableAttributes: FilterableAttribute[];
  currentFilters: FilterInput[];
  priceRange?: PriceRange;
  categories: CategoryFilter[];
  onRemoveFilter?: (key: string, value?: string) => void;
}> = ({ availableAttributes, currentFilters, priceRange, categories, onRemoveFilter }) => {
  const filterSummary = getFilterSummary(
    availableAttributes,
    currentFilters,
    priceRange,
    categories
  );

  if (filterSummary.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {_('Active Filters')}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {filterSummary.map((item, index) => (
          <span
            key={`${item.key}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            {item.label}
            {onRemoveFilter && (
              <button
                type="button"
                onClick={() => onRemoveFilter(item.key, item.value)}
                className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-300 hover:text-slate-600"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};
