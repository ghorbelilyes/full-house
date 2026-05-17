import { select } from '@evershop/postgres-query-builder';

function isPromotionActive(promo) {
  if (!promo || !promo.enabled) return false;
  const now = new Date();
  if (promo.start_date && new Date(promo.start_date) > now) return false;
  if (promo.end_date && new Date(promo.end_date) < now) return false;
  return true;
}

function computeDiscount(price, promo) {
  if (!promo) return { finalPrice: price, savedAmount: 0, discountPercent: 0 };
  const promoValue = parseFloat(promo.promotion_value);
  let savedAmount = 0;
  if (promo.promotion_type === 'percentage') {
    savedAmount = (price * promoValue) / 100;
  } else {
    savedAmount = Math.min(promoValue, price);
  }
  const finalPrice = Math.max(0, price - savedAmount);
  const discountPercent = price > 0 ? (savedAmount / price) * 100 : 0;
  return { finalPrice, savedAmount, discountPercent };
}

export default {
  Product: {
    promotion: async (product, _, { pool }) => {
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

      const price = parseFloat(product.price);
      const active = isPromotionActive(promo);
      const { finalPrice, savedAmount, discountPercent } = active
        ? computeDiscount(price, promo)
        : { finalPrice: price, savedAmount: 0, discountPercent: 0 };

      return {
        productPromotionId: promo.product_promotion_id,
        uuid: promo.uuid,
        promotionType: promo.promotion_type,
        promotionValue: parseFloat(promo.promotion_value),
        promotionLabel:
          promo.promotion_label ||
          (promo.promotion_type === 'percentage'
            ? `-${parseFloat(promo.promotion_value)}%`
            : `-${parseFloat(promo.promotion_value)}`),
        startDate: promo.start_date
          ? new Date(promo.start_date).toISOString()
          : null,
        endDate: promo.end_date
          ? new Date(promo.end_date).toISOString()
          : null,
        enabled: promo.enabled,
        isActive: active,
        discountPercent: active ? Math.round(discountPercent * 100) / 100 : null,
        savedAmount: active ? savedAmount : null,
        originalPrice: price,
        finalPrice: active ? finalPrice : price
      };
    }
  }
};
