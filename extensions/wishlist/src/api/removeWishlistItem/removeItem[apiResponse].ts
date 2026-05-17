import { select, del, update } from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';

export default async (request, response, next) => {
  try {
    const { sessionID, customer } = request.locals;
    const sid = sessionID || '';
    const customerId = customer?.customer_id;
    const productId = parseInt(request.params.product_id, 10);

    // Find wishlist
    let wishlist = await select()
      .from('wishlist')
      .where('status', '=', 1)
      .andWhere('sid', '=', sid)
      .load(pool);

    if (!wishlist && customerId) {
      wishlist = await select()
        .from('wishlist')
        .where('status', '=', 1)
        .andWhere('customer_id', '=', customerId)
        .load(pool);
    }

    if (!wishlist) {
      response.status(404);
      return response.json({
        error: { status: 404, message: 'Liste de favoris introuvable' }
      });
    }

    // Delete item
    await del('wishlist_item')
      .where('wishlist_id', '=', wishlist.wishlist_id)
      .and('product_id', '=', productId)
      .execute(pool);

    // Update wishlist timestamp
    await update('wishlist')
      .given({ updated_at: new Date().toISOString() })
      .where('wishlist_id', '=', wishlist.wishlist_id)
      .execute(pool);

    response.status(200);
    response.$body = {
      data: { message: 'Produit retiré des favoris' }
    };
    next();
  } catch (e) {
    response.status(500);
    response.json({
      error: { status: 500, message: (e as Error)?.message }
    });
  }
};
