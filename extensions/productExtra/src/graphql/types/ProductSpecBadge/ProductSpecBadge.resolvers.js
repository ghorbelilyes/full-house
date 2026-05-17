import { select } from '@evershop/postgres-query-builder';

export default {
  Product: {
    specBadges: async (product, _args, { pool }) => {
      const productId = product.productId || product.product_id;
      if (!productId) return [];
      try {
        const query = select().from('product_spec_badge');
        query.orderBy('sort_order', 'ASC');
        query.where('product_id', '=', productId);
        const rows = await query.execute(pool);
        return rows.map(r => ({
          specBadgeId: r.spec_badge_id,
          productId: r.product_id,
          icon: r.icon,
          value: r.value,
          label: r.label,
          badgeSize: r.badge_size || 'md',
          sortOrder: r.sort_order
        }));
      } catch (e) {
        console.error('[specBadges] Error:', e.message);
        return [];
      }
    }
  }
};
