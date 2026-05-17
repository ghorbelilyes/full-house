import { select, sql } from '@evershop/postgres-query-builder';

export default {
  Product: {
    reviewSummary: async (product, _args, { pool, ...context }) => {
      const productId = product.productId || product.product_id;
      if (!productId) return { averageRating: 0, totalReviews: 0, reviews: [], customerReview: null };

      let reviews;
      try {
        const query = select();
        query.select(sql('r.*'));
        query.select('c.full_name', 'customer_name');
        query.from('product_review', 'r');
        query.leftJoin('customer', 'c').on('r.customer_id', '=', 'c.customer_id');
        query.orderBy('r.created_at', 'DESC');
        query.where('r.product_id', '=', productId);
        reviews = await query.execute(pool);
      } catch (e) {
        console.error('[reviewSummary] Error:', e.message);
        return { averageRating: 0, totalReviews: 0, reviews: [], customerReview: null };
      }

      const totalReviews = reviews.length;
      const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

      // Check if current customer has reviewed
      let customerReview = null;
      const customer = context?.customer;
      if (customer) {
        customerReview = reviews.find(r => r.customer_id === (customer.customerId || customer.customer_id)) || null;
      }

      const formatDate = (d) => d instanceof Date ? d.toISOString() : String(d);

      return {
        averageRating,
        totalReviews,
        reviews: reviews.map(r => ({
          reviewId: r.review_id,
          uuid: r.uuid,
          productId: r.product_id,
          customerId: r.customer_id,
          customerName: r.customer_name || r.full_name || 'Client',
          rating: r.rating,
          comment: r.comment,
          createdAt: formatDate(r.created_at)
        })),
        customerReview: customerReview ? {
          reviewId: customerReview.review_id,
          uuid: customerReview.uuid,
          productId: customerReview.product_id,
          customerId: customerReview.customer_id,
          customerName: customerReview.customer_name || customerReview.full_name || 'Client',
          rating: customerReview.rating,
          comment: customerReview.comment,
          createdAt: formatDate(customerReview.created_at)
        } : null
      };
    }
  }
};
