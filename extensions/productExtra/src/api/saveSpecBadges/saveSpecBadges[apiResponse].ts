import {
  select,
  insert,
  del,
  startTransaction,
  commit,
  rollback
} from '@evershop/postgres-query-builder';
import { getConnection } from '@evershop/evershop/lib/postgres';

export default async function saveSpecBadges(request, response) {
  const productId = parseInt(request.params.id, 10);
  const { badges } = request.body;

  if (!Array.isArray(badges)) {
    response.status(400);
    return response.json({
      success: false,
      message: 'badges must be an array'
    });
  }

  const VALID_SIZES = ['sm', 'md', 'lg'];

  const connection = await getConnection();
  await startTransaction(connection);
  try {
    // Check product exists
    const product = await select()
      .from('product')
      .where('product_id', '=', productId)
      .load(connection);

    if (!product) {
      await rollback(connection);
      response.status(404);
      return response.json({ success: false, message: 'Product not found' });
    }

    // Delete all existing spec badges for this product
    await del('product_spec_badge')
      .where('product_id', '=', productId)
      .execute(connection);

    // Insert new badges
    for (let i = 0; i < badges.length; i++) {
      const badge = badges[i];
      if (!badge.value && !badge.label) continue;
      const size = VALID_SIZES.includes(badge.badgeSize) ? badge.badgeSize : 'md';
      await insert('product_spec_badge')
        .given({
          icon: badge.icon || null,
          value: badge.value || '',
          label: badge.label || '',
          badge_size: size,
          sort_order: i
        })
        .prime('product_id', productId)
        .execute(connection);
    }

    await commit(connection);
    return response.json({ success: true });
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}
