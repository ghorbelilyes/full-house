import { select } from '@evershop/postgres-query-builder';

export default {
  Product: {
    trustBadges: async (product, _args, { pool }) => {
      const productId = product.productId || product.product_id;
      if (!productId) return [];
      try {
        const query = select().from('product_trust_badge');
        query.orderBy('sort_order', 'ASC');
        query.where('product_id', '=', productId);
        const rows = await query.execute(pool);
        return rows.map(r => ({
          trustBadgeId: r.trust_badge_id,
          productId: r.product_id,
          icon: r.icon,
          label: r.label,
          sortOrder: r.sort_order
        }));
      } catch (e) {
        console.error('[trustBadges] Error:', e.message);
        return [];
      }
    }
  }
};
