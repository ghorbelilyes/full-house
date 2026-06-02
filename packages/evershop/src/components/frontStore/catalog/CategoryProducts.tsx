import Area from '@components/common/Area.js';
import { useCategory } from '@components/frontStore/catalog/CategoryContext.js';
import { ProductList } from '@components/frontStore/catalog/ProductList.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

export function CategoryProducts() {
  const { showProducts, products } = useCategory();
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
        />
        <p className="mt-8 text-center text-sm text-slate-500">
          {_('${count} products', { count: products.total.toString() })}
        </p>
      </div>
      <Area id="categoryProductsAfter" className="category__products__after" />
    </>
  );
}
