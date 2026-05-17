import { ProductData } from '@components/frontStore/catalog/ProductContext.js';
import { ProductListEmptyRender } from '@components/frontStore/catalog/ProductListEmptyRender.js';
import { ProductListItemRender } from '@components/frontStore/catalog/ProductListItemRender.js';
import { ProductListLoadingSkeleton } from '@components/frontStore/catalog/ProductListLoadingSkeleton.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React, { ReactNode } from 'react';

export interface ProductListProps {
  products: ProductData[];
  imageWidth?: number;
  imageHeight?: number;
  isLoading?: boolean;
  emptyMessage?: string | ReactNode;
  className?: string;
  layout?: 'grid' | 'list';
  gridColumns?: number;
  showAddToCart?: boolean;
  customAddToCartRenderer?: (product: ProductData) => ReactNode;
  renderItem?: (product: ProductData) => ReactNode;
}

export const ProductList: React.FC<ProductListProps> = ({
  products = [],
  imageWidth = 300,
  imageHeight = 300,
  isLoading = false,
  emptyMessage = _('No products found'),
  className = '',
  layout = 'grid',
  gridColumns = 4,
  showAddToCart = false,
  customAddToCartRenderer,
  renderItem
}) => {
  if (isLoading) {
    return (
      <ProductListLoadingSkeleton
        count={layout === 'list' ? 5 : gridColumns * 2}
        gridColumns={gridColumns}
        layout={layout}
      />
    );
  }

  if (!products || products.length === 0) {
    return <ProductListEmptyRender message={emptyMessage} />;
  }

  const itemImageWidth =
    layout === 'list' ? (imageWidth > 150 ? 150 : imageWidth) : imageWidth;
  const itemImageHeight =
    layout === 'list' ? (imageHeight > 150 ? 150 : imageHeight) : imageHeight;

  if (layout === 'list') {
    return (
      <div className={`flex flex-col gap-6 ${className}`}>
        {products.map((product) => (
          <div key={product.productId}>
            {renderItem ? (
              renderItem(product)
            ) : (
              <ProductListItemRender
                product={product}
                imageWidth={itemImageWidth}
                imageHeight={itemImageHeight}
                layout="list"
                showAddToCart={showAddToCart}
                customAddToCartRenderer={customAddToCartRenderer}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Grid column classes matching the reference design
  const gridClassName = (() => {
    switch (gridColumns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 5:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      case 6:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  })();

  return (
    <div className={`grid ${gridClassName} gap-8 ${className}`}>
      {products.map((product) => (
        <div key={product.productId}>
          {renderItem ? (
            renderItem(product)
          ) : (
            <ProductListItemRender
              product={product}
              imageWidth={itemImageWidth}
              imageHeight={itemImageHeight}
              layout="grid"
              showAddToCart={showAddToCart}
              customAddToCartRenderer={customAddToCartRenderer}
            />
          )}
        </div>
      ))}
    </div>
  );
};
