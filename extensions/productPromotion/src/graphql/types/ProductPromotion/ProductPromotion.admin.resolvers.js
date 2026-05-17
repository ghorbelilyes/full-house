import { select } from '@evershop/postgres-query-builder';

export default {
  Product: {
    promotionAdmin: async (product, _, { pool }) => {
      let promo;
      try {
        promo = await select()
          .from('product_promotion')
          .where('product_id', '=', product.productId || product.product_id)
          .load(pool);
      } catch (e) {
        return null;
      }

      if (!promo) return null;

      return {
        productPromotionId: promo.product_promotion_id,
        promotionType: promo.promotion_type,
        promotionValue: parseFloat(promo.promotion_value),
        promotionLabel: promo.promotion_label,
        startDate: promo.start_date
          ? new Date(promo.start_date).toISOString().split('T')[0]
          : null,
        endDate: promo.end_date
          ? new Date(promo.end_date).toISOString().split('T')[0]
          : null,
        enabled: promo.enabled
      };
    }
  }
};
