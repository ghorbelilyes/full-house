import Area from '@components/common/Area.js';
import { useCategory } from '@components/frontStore/catalog/CategoryContext.js';
import { DefaultProductFilterRender } from '@components/frontStore/catalog/DefaultProductFilterRender.js';
import {
  CategoryFilter,
  ProductFilter
} from '@components/frontStore/catalog/ProductFilter.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

export function CategoryProductsFilter({
  categories
}: {
  categories?: CategoryFilter[];
}) {
  const category = useCategory();
  const filterCategories = categories || category.children;

  return (
    <>
      <Area id="beforeFilter" noOuter />
      <ProductFilter
        currentFilters={category.products.currentFilters}
        availableAttributes={category.availableAttributes}
        categories={filterCategories}
        priceRange={category.priceRange}
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
