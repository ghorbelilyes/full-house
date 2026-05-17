import {
  del,
  startTransaction,
  commit,
  rollback
} from '@evershop/postgres-query-builder';
import { getConnection } from '@evershop/evershop/lib/postgres';

export default async function deleteProductPromotion(request, response) {
  const productId = request.params.id;
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    await del('product_promotion')
      .where('product_id', '=', productId)
      .execute(connection);

    await commit(connection);
    return response.json({
      success: true
    });
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}
