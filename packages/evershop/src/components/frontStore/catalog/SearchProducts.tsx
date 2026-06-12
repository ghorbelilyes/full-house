import { Area } from '@components/common/index.js';
import { useAppDispatch } from '@components/common/context/app.js';
import { ProductList } from '@components/frontStore/catalog/ProductList.js';
import { useSearch } from '@components/frontStore/catalog/SearchContext.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React, { useCallback } from 'react';

export function SearchProducts() {
  const { products } = useSearch();
  const AppContextDispatch = useAppDispatch();

  const handleResetFilters = useCallback(() => {
    const url = new URL(window.location.href, window.location.origin);
    // Keep keyword, remove other filters
    const keyword = url.searchParams.get('keyword');
    for (const key of [...url.searchParams.keys()]) {
      if (!['page', 'limit', 'keyword'].includes(key)) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.append('ajax', 'true');
    AppContextDispatch.fetchPageData(url).then(() => {
      url.searchParams.delete('ajax');
      history.pushState(null, '', url);
    });
  }, [AppContextDispatch]);

  return (
    <>
      <Area id="searchProductsBefore" noOuter />
      <div>
        <ProductList
          products={products.items}
          layout="grid"
          gridColumns={3}
          showAddToCart={true}
          onResetFilters={handleResetFilters}
        />
        {products.total > 0 && (
          <p className="mt-6 text-center text-sm text-slate-400">
            {_('${count} products', { count: products.total.toString() })}
          </p>
        )}
      </div>
      <Area id="searchProductsAfter" noOuter />
    </>
  );
}
