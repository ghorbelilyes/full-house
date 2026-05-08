import Area from '@components/common/Area.js';
import {
  CategoryData,
  CategoryProvider
} from '@components/frontStore/catalog/CategoryContext.js';
import { CategoryInfo } from '@components/frontStore/catalog/CategoryInfo.js';
import { CategoryProducts } from '@components/frontStore/catalog/CategoryProducts.js';
import { CategoryProductsFilter } from '@components/frontStore/catalog/CategoryProductsFilter.js';
import { CategoryProductsPagination } from '@components/frontStore/catalog/CategoryProductsPagination.js';
import { CategorySidebar } from '@components/frontStore/catalog/CategorySidebar.js';
import { ProductSorting } from '@components/frontStore/catalog/ProductSorting.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

interface SidebarCategoryItem {
  categoryId: number;
  name: string;
  url: string;
  children?: SidebarCategoryItem[];
}

interface CategoryViewProps {
  category: CategoryData;
  navCategories: {
    items: SidebarCategoryItem[];
  };
}

export default function CategoryView({
  category,
  navCategories
}: CategoryViewProps) {
  // Build tree: items from the query are ALL categories (flat with children
  // populated by the resolver). Top-level = those returned by the query with
  // the include_in_nav filter. The `children` field on each is resolved by
  // GraphQL automatically.
  const categoryTree = (navCategories?.items || []).slice().sort((a, b) =>
    a.name.localeCompare(b.name, 'fr')
  );

  return (
    <CategoryProvider category={category}>
      <Area id="categoryPageTop" className="category__page__top" />
      <CategoryInfo />
      <div className="page-width grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <Area
          id="categoryLeftColumn"
          className="h-fit space-y-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6"
          coreComponents={[
            {
              component: {
                default: (
                  <CategorySidebar categoryTree={categoryTree} />
                )
              },
              sortOrder: 5,
              id: 'categorySidebar'
            },
            {
              component: { default: <CategoryProductsFilter /> },
              sortOrder: 10,
              id: 'productFilter'
            }
          ]}
        />
        <Area
          id="categoryRightColumn"
          className=""
          coreComponents={[
            {
              component: {
                default: (
                  <ProductSorting
                    className="flex justify-start"
                    count={category.products.total}
                  />
                )
              },
              sortOrder: 10,
              id: 'categoryProductsSorting'
            },
            {
              component: { default: <CategoryProducts /> },
              sortOrder: 20,
              id: 'categoryProducts'
            },
            {
              component: { default: <CategoryProductsPagination /> },
              sortOrder: 30,
              id: 'categoryProductsPagination'
            }
          ]}
        />
      </div>
      <Area id="categoryPageBottom" className="category__page__bottom" />
    </CategoryProvider>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    category: currentCategory {
      showProducts
      categoryId
      name
      uuid
      description
      image {
        alt
        url
      }
      products {
        items {
          ...Product
        }
        currentFilters {
          key
          operation
          value
        }
        total
      }
      availableAttributes {
        attributeCode
        attributeName
        options {
          optionId
          optionText
        }
      }
      priceRange {
        min
        max
        minText
        maxText
      }
      children {
        categoryId,
        name
        uuid
      }
    }
    navCategories: categories(
      filters: [
        { key: "include_in_nav", operation: eq, value: "1" },
        { key: "parent", operation: eq, value: "null" }
      ]
    ) {
      items {
        categoryId
        name
        url
        children {
          categoryId
          name
          url
          children {
            categoryId
            name
            url
          }
        }
      }
    }
}`;

export const fragments = `
  fragment Product on Product {
    productId
    name
    sku
    price {
      regular {
        value
        text
      }
      special {
        value
        text
      }
    }
    promotion {
      promotionType
      promotionValue
      promotionLabel
      isActive
      discountPercent
    }
    inventory {
      isInStock
    }
    image {
      alt
      url
    }
    url
  }
`;
