import { Checkbox } from '@components/common/ui/Checkbox.js';
import { Label } from '@components/common/ui/Label.js';
import { DefaultFilterWrapperRender } from '@components/frontStore/catalog/DefaultFilterWrapperRender.js';
import {
  CategoryFilter,
  FilterInput,
  useProductFilter
} from '@components/frontStore/catalog/ProductFilter.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { Search, X } from 'lucide-react';
import React, { useState } from 'react';

export const DefaultCategoryFilterRender: React.FC<{
  categories: CategoryFilter[];
  currentFilters: FilterInput[];
}> = ({ categories, currentFilters }) => {
  const { updateFilter } = useProductFilter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    let newFilters = currentFilters.map((f) => ({ ...f }));
    const existingFilter = newFilters.find((f) => f.key === 'cat');

    if (checked) {
      if (existingFilter) {
        const values = existingFilter.value.split(',');
        if (!values.includes(categoryId)) {
          values.push(categoryId);
          existingFilter.value = values.join(',');
        }
      } else {
        newFilters.push({
          key: 'cat',
          operation: 'in',
          value: categoryId
        });
      }
    } else if (existingFilter) {
      const values = existingFilter.value
        .split(',')
        .filter((v) => v !== categoryId);
      if (values.length === 0) {
        newFilters = newFilters.filter((f) => f.key !== 'cat');
      } else {
        existingFilter.value = values.join(',');
      }
    }

    updateFilter(newFilters);
  };

  const isCategorySelected = (categoryId: string) => {
    const filter = currentFilters.find((f) => f.key === 'cat');
    return filter ? filter.value.split(',').includes(categoryId) : false;
  };

  const getSelectedCount = () => {
    const filter = currentFilters.find((f) => f.key === 'cat');
    return filter ? filter.value.split(',').length : 0;
  };

  const clearCategoryFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFilters = currentFilters.filter((f) => f.key !== 'cat');
    updateFilter(newFilters);
  };

  const getFilteredCategories = () => {
    if (!searchTerm) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  const selectedCount = getSelectedCount();
  const filteredCategories = getFilteredCategories();

  return (
    <DefaultFilterWrapperRender
      title={_('Categories')}
      badge={selectedCount}
    >
      <div>
        {/* Search within categories */}
        {categories.length > 6 && (
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={_('Search categories...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-8 text-xs text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Category options */}
        <div className="space-y-0.5 max-h-52 overflow-y-auto overscroll-contain pr-1">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => {
              const isSelected = isCategorySelected(
                category.categoryId.toString()
              );
              return (
                <label
                  key={category.categoryId}
                  htmlFor={`category-${category.categoryId}`}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'bg-brand-soft text-primary'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Checkbox
                    id={`category-${category.categoryId}`}
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(
                        category.categoryId.toString(),
                        checked
                      )
                    }
                  />
                  <span className="flex-1 text-[13px]">{category.name}</span>
                </label>
              );
            })
          ) : (
            <p className="py-3 text-center text-xs text-slate-400">
              {_('No categories found')}
            </p>
          )}
        </div>

        {/* Clear */}
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={clearCategoryFilter}
            className="mt-2 text-[11px] font-medium text-slate-400 transition-colors hover:text-red-500"
          >
            {_('Clear')} ({selectedCount})
          </button>
        )}
      </div>
    </DefaultFilterWrapperRender>
  );
};
