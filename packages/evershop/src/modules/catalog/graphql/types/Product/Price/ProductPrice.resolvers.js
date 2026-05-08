import { select } from '@evershop/postgres-query-builder';

function isPromotionActive(promo) {
  if (!promo || !promo.enabled) return false;
  const now = new Date();
  if (promo.start_date && new Date(promo.start_date) > now) return false;
  if (promo.end_date && new Date(promo.end_date) < now) return false;
  return true;
}

export default {
  Product: {
    price: async (product, _, { pool }) => {
      const price = parseFloat(product.price);
      let special = price;
      const pid = product.productId || product.product_id;

      try {
        const promo = await select()
          .from('product_promotion')
          .where('product_id', '=', pid)
          .load(pool);

        if (promo && isPromotionActive(promo)) {
          const promoValue = parseFloat(promo.promotion_value);
          if (promo.promotion_type === 'percentage') {
            special = Math.max(0, price - (price * promoValue) / 100);
          } else {
            special = Math.max(0, price - promoValue);
          }
        }
      } catch (e) {
        // If promotion table doesn't exist yet, just use regular price
      }

      return {
        regular: price,
        special: special
      };
    }
  }
};
