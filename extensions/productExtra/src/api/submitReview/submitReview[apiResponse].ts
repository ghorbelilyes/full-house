import {
  select,
  insert,
  update,
  startTransaction,
  commit,
  rollback
} from '@evershop/postgres-query-builder';
import { getConnection } from '@evershop/evershop/lib/postgres';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/** Lightweight inline module check (reads config/modules.json) */
function _isModuleActive(code) {
  try {
    const p = resolve(process.cwd(), 'config/modules.json');
    if (!existsSync(p)) return true;
    const cfg = JSON.parse(readFileSync(p, 'utf-8'));
    const mod = cfg.modules?.[code];
    if (!mod) return true;
    if (mod.contractIncluded === false) return false;
    return mod.enabled !== false;
  } catch { return true; }
}

export default async function submitReview(request, response) {
  // Module gate: block if productReviews is disabled
  if (!_isModuleActive('productReviews')) {
    response.status(403);
    return response.json({
      error: 'MODULE_DISABLED',
      message: 'Ce module est désactivé pour ce magasin.'
    });
  }

  const productId = parseInt(request.params.id, 10);
  const { rating, comment } = request.body;

  // Check customer is logged in via session
  const customer = request.locals?.customer;
  if (!customer || !customer.customer_id) {
    response.status(401);
    return response.json({
      success: false,
      message: 'Vous devez être connecté pour laisser un avis'
    });
  }

  const customerId = customer.customer_id;

  // Validate rating
  const ratingNum = parseInt(rating, 10);
  if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
    response.status(400);
    return response.json({
      success: false,
      message: 'La note doit être entre 0 et 5'
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
        message: 'Produit non trouvé'
      });
    }

    // Check if customer already reviewed
    const existing = await select()
      .from('product_review')
      .where('product_id', '=', productId)
      .and('customer_id', '=', customerId)
      .load(connection);

    let result;
    if (existing) {
      // Update existing review
      result = await update('product_review')
        .given({
          rating: ratingNum,
          comment: comment || null
        })
        .where('review_id', '=', existing.review_id)
        .execute(connection);
    } else {
      // Insert new review
      result = await insert('product_review')
        .given({
          rating: ratingNum,
          comment: comment || null
        })
        .prime('product_id', productId)
        .prime('customer_id', customerId)
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
