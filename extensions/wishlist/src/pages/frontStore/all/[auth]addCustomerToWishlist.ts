import { select, update } from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';

export default async (request, response, next) => {
  try {
    const { sessionID } = request;
    const customer = request.getCurrentCustomer();
    if (customer && sessionID) {
      // Check if there is a wishlist with this sid
      const wishlist = await select()
        .from('wishlist')
        .where('sid', '=', sessionID)
        .and('status', '=', 1)
        .load(pool);

      if (wishlist) {
        await update('wishlist')
          .given({
            customer_id: customer.customer_id,
            customer_full_name: customer.full_name,
            customer_email: customer.email
          })
          .where('wishlist_id', '=', wishlist.wishlist_id)
          .execute(pool);
      } else {
        // Check if customer has an existing wishlist without this sid
        const customerWishlist = await select()
          .from('wishlist')
          .where('customer_id', '=', customer.customer_id)
          .and('status', '=', 1)
          .load(pool);

        if (customerWishlist) {
          await update('wishlist')
            .given({ sid: sessionID })
            .where('wishlist_id', '=', customerWishlist.wishlist_id)
            .execute(pool);
        }
      }
    }
  } catch (e) {
    // Do not block page load on wishlist errors
  }
  next();
};
