import { Slider } from '@components/common/ui/Slider.js';
import { DefaultFilterWrapperRender } from '@components/frontStore/catalog/DefaultFilterWrapperRender.js';
import {
  PriceRange,
  FilterInput,
  useProductFilter,
  ProductFilterProps
} from '@components/frontStore/catalog/ProductFilter.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React, { useState, useMemo } from 'react';

export const DefaultPriceFilterRender: React.FC<{
  priceRange: PriceRange;
  currentFilters: FilterInput[];
  setting?: ProductFilterProps['setting'];
}> = ({ priceRange, currentFilters, setting }) => {
  const { updateFilter } = useProductFilter();

  const [localMin, setLocalMin] = useState(() => {
    const minFilter = currentFilters.find((f) => f.key === 'min_price');
    return minFilter ? parseInt(minFilter.value) : priceRange.min;
  });

  const [localMax, setLocalMax] = useState(() => {
    const maxFilter = currentFilters.find((f) => f.key === 'max_price');
    return maxFilter ? parseInt(maxFilter.value) : priceRange.max;
  });

  const debouncedUpdate = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (min: number, max: number) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newFilters = currentFilters.filter(
          (f) => f.key !== 'min_price' && f.key !== 'max_price'
        );

        if (min > priceRange.min) {
          newFilters.push({
            key: 'min_price',
            operation: 'eq',
            value: min.toString()
          });
        }
        if (max < priceRange.max) {
          newFilters.push({
            key: 'max_price',
            operation: 'eq',
            value: max.toString()
          });
        }

        updateFilter(newFilters);
      }, 300);
    };
  }, [currentFilters, priceRange, updateFilter]);

  React.useEffect(() => {
    const minFilter = currentFilters.find((f) => f.key === 'min_price');
    const maxFilter = currentFilters.find((f) => f.key === 'max_price');

    setLocalMin(minFilter ? parseInt(minFilter.value) : priceRange.min);
    setLocalMax(maxFilter ? parseInt(maxFilter.value) : priceRange.max);
  }, [currentFilters, priceRange]);

  const handleRangeChange = (values: number[]) => {
    const [min, max] = values;
    setLocalMin(min);
    setLocalMax(max);
    debouncedUpdate(min, max);
  };

  const isFiltered =
    localMin > priceRange.min || localMax < priceRange.max;

  return (
    <DefaultFilterWrapperRender
      title={_('Price')}
      badge={isFiltered ? 1 : 0}
    >
      <div className="px-1">
        {/* Current range display */}
        <div className="mb-4 flex items-center justify-center gap-2 text-sm">
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 tabular-nums">
            {priceRange.minText}
          </span>
          <span className="text-slate-400">—</span>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 tabular-nums">
            {priceRange.maxText}
          </span>
        </div>

        {/* Slider */}
        <div className="px-1">
          <Slider
            min={priceRange.min}
            max={priceRange.max}
            value={[localMin, localMax]}
            onValueChange={handleRangeChange}
          />
        </div>
      </div>
    </DefaultFilterWrapperRender>
  );
};
