import Area from '@components/common/Area.js';
import { DefaultProductFilterRender } from '@components/frontStore/catalog/DefaultProductFilterRender.js';
import {
  CategoryFilter,
  ProductFilter
} from '@components/frontStore/catalog/ProductFilter.js';
import { useSearch } from '@components/frontStore/catalog/SearchContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

export function SearchProductsFilter({
  categories
}: {
  categories?: CategoryFilter[];
}) {
  const search = useSearch();
  const filterCategories = categories || [];

  return (
    <>
      <Area id="beforeFilter" noOuter />
      <ProductFilter
        currentFilters={search.products.currentFilters}
        availableAttributes={[]}
        categories={filterCategories}
        priceRange={{ min: 0, max: 0, minText: '', maxText: '' }}
      >
        {(renderProps) => (
          <DefaultProductFilterRender
            renderProps={renderProps}
            title={_('Product Filters')}
            showFilterSummary={true}
          />
        )}
      </ProductFilter>
      <Area id="afterFilter" noOuter />
    </>
  );
}
