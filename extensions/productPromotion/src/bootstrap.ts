import { addProcessor } from '@evershop/evershop/lib/util/registry';

export default function bootstrap() {
  // Register promo product filter
  addProcessor(
    'productCollectionFilters',
    (filters) => [
      ...filters,
      {
        key: 'promo',
        operation: ['eq'],
        callback: (query, operation, value, currentFilters) => {
          if (value !== '1') {
            return;
          }

          query
            .innerJoin('product_promotion', 'product_promotion_filter')
            .on('product_promotion_filter.product_id', '=', 'product.product_id')
            .and('product_promotion_filter.enabled', '=', true);
          query
            .getWhere()
            .addRaw(
              'AND',
              '(product_promotion_filter.start_date IS NULL OR product_promotion_filter.start_date <= NOW())'
            )
            .addRaw(
              'AND',
              '(product_promotion_filter.end_date IS NULL OR product_promotion_filter.end_date >= NOW())'
            );
          currentFilters.push({
            key: 'promo',
            operation,
            value
          });
        }
      }
    ],
    3
  );

  // Register additional sort-by keys: promo, review
  addProcessor(
    'productCollectionSortBy',
    (sortBy) => ({
      ...sortBy,
      promo: (query) => {
        // Sort promo products first using a subquery expression
        query.orderBy('product.product_id', 'DESC');
        query._orderBy._field =
          'CASE WHEN EXISTS (' +
          'SELECT 1 FROM product_promotion pp ' +
          'WHERE pp.product_id = product.product_id ' +
          'AND pp.enabled = true ' +
          'AND (pp.start_date IS NULL OR pp.start_date <= NOW()) ' +
          'AND (pp.end_date IS NULL OR pp.end_date >= NOW())' +
          ') THEN 0 ELSE 1 END';
        query._orderBy._direction = 'ASC';
      },
      review: (query) => {
        // Sort by average review rating
        query.orderBy('product.product_id', 'DESC');
        query._orderBy._field =
          'COALESCE((SELECT AVG(pr.rating) FROM product_review pr WHERE pr.product_id = product.product_id), 0)';
        query._orderBy._direction = 'DESC';
      }
    }),
    3
  );
}
