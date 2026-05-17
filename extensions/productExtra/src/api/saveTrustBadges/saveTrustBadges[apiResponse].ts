import {
  select,
  insert,
  del,
  startTransaction,
  commit,
  rollback
} from '@evershop/postgres-query-builder';
import { getConnection } from '@evershop/evershop/lib/postgres';

export default async function saveTrustBadges(request, response) {
  const productId = parseInt(request.params.id, 10);
  const { badges } = request.body;

  if (!Array.isArray(badges)) {
    response.status(400);
    return response.json({
      success: false,
      message: 'badges must be an array'
    });
  }

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

    // Delete all existing trust badges for this product
    await del('product_trust_badge')
      .where('product_id', '=', productId)
      .execute(connection);

    // Insert new badges
    for (let i = 0; i < badges.length; i++) {
      const badge = badges[i];
      if (!badge.label) continue;
      await insert('product_trust_badge')
        .given({
          icon: badge.icon || '🚚',
          label: badge.label,
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
