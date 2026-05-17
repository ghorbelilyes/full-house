import {
  select,
  insert,
  update,
  startTransaction,
  commit,
  rollback
} from '@evershop/postgres-query-builder';
import { getConnection } from '@evershop/evershop/lib/postgres';

export default async function saveProductPromotion(request, response) {
  const productId = request.params.id;
  const {
    promotion_type = 'percentage',
    promotion_value = 0,
    promotion_label = null,
    start_date = null,
    end_date = null,
    enabled = true
  } = request.body;

  // Validate
  if (!['percentage', 'fixed'].includes(promotion_type)) {
    response.status(400);
    return response.json({
      success: false,
      message: 'promotion_type must be "percentage" or "fixed"'
    });
  }

  const value = parseFloat(promotion_value);
  if (isNaN(value) || value < 0) {
    response.status(400);
    return response.json({
      success: false,
      message: 'promotion_value must be a non-negative number'
    });
  }

  if (promotion_type === 'percentage' && value > 100) {
    response.status(400);
    return response.json({
      success: false,
      message: 'Percentage discount cannot exceed 100%'
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
      return response.json({
        success: false,
        message: 'Product not found'
      });
    }

    const existing = await select()
      .from('product_promotion')
      .where('product_id', '=', productId)
      .load(connection);

    const data = {
      promotion_type,
      promotion_value: value,
      promotion_label: promotion_label || null,
      start_date: start_date || null,
      end_date: end_date || null,
      enabled: enabled === true || enabled === 'true' || enabled === '1' || enabled === 1
    };

    let result;
    if (existing) {
      result = await update('product_promotion')
        .given(data)
        .where('product_id', '=', productId)
        .execute(connection);
    } else {
      result = await insert('product_promotion')
        .given(data)
        .prime('product_id', productId)
        .execute(connection);
    }

    await commit(connection);
    return response.json({
      success: true,
      data: result
    });
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}
