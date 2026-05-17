import { select, insert, update } from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';

export default async (request, response, next) => {
  try {
    const { sessionID, customer } = request.locals;
    const sid = sessionID || '';
    const customerId = customer?.customer_id;
    const { product_id, sku } = request.body;

    // Resolve product
    let product;
    if (product_id) {
      product = await select()
        .from('product')
        .where('product_id', '=', product_id)
        .and('status', '=', 1)
        .load(pool);
    } else if (sku) {
      product = await select()
        .from('product')
        .where('sku', '=', sku)
        .and('status', '=', 1)
        .load(pool);
    }

    if (!product) {
      response.status(400);
      return response.json({
        error: { status: 400, message: 'Produit introuvable' }
      });
    }

    // Get or create wishlist
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
      if (wishlist) {
        await update('wishlist')
          .given({ sid })
          .where('wishlist_id', '=', wishlist.wishlist_id)
          .execute(pool);
      }
    }

    if (!wishlist) {
      const data: any = { sid, status: 1 };
      if (customerId) {
        data.customer_id = customerId;
        data.customer_email = customer.email || null;
        data.customer_full_name = customer.full_name || null;
      }
      wishlist = await insert('wishlist').given(data).execute(pool);
    }

    // Get thumbnail
    const mainImage = await select()
      .from('product_image')
      .where('product_image_product_id', '=', product.product_id)
      .andWhere('is_main', '=', true)
      .load(pool);
    const thumbnail = mainImage?.image || null;

    // Check duplicate
    const existing = await select()
      .from('wishlist_item')
      .where('wishlist_id', '=', wishlist.wishlist_id)
      .andWhere('product_id', '=', product.product_id)
      .load(pool);

    if (existing) {
      response.status(200);
      response.$body = {
        data: {
          item: existing,
          message: 'Produit déjà dans les favoris'
        }
      };
      return next();
    }

    // Insert item
    const item = await insert('wishlist_item')
      .given({
        wishlist_id: wishlist.wishlist_id,
        product_id: product.product_id,
        product_sku: product.sku,
        product_name: product.name || null,
        thumbnail
      })
      .execute(pool);

    // Update wishlist timestamp
    await update('wishlist')
      .given({ updated_at: new Date().toISOString() })
      .where('wishlist_id', '=', wishlist.wishlist_id)
      .execute(pool);

    response.status(200);
    response.$body = {
      data: {
        item,
        message: 'Produit ajouté aux favoris'
      }
    };
    next();
  } catch (e) {
    response.status(500);
    response.json({
      error: { status: 500, message: (e as Error)?.message }
    });
  }
};
