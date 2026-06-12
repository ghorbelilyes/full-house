import Area from '@components/common/Area.js';
import { useCategory } from '@components/frontStore/catalog/CategoryContext.js';
import { ProductList } from '@components/frontStore/catalog/ProductList.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React, { useCallback } from 'react';
import { useAppDispatch } from '@components/common/context/app.js';

export function CategoryProducts() {
  const { showProducts, products } = useCategory();
  const AppContextDispatch = useAppDispatch();

  const handleResetFilters = useCallback(() => {
    const url = new URL(window.location.href, window.location.origin);
    for (const key of [...url.searchParams.keys()]) {
      if (!['page', 'limit'].includes(key)) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.append('ajax', 'true');
    AppContextDispatch.fetchPageData(url).then(() => {
      url.searchParams.delete('ajax');
      history.pushState(null, '', url);
    });
  }, [AppContextDispatch]);

  if (!showProducts) {
    return null;
  }

  return (
    <>
      <Area
        id="categoryProductsBefore"
        className="category__products__before"
      />
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
      <Area id="categoryProductsAfter" className="category__products__after" />
    </>
  );
}
