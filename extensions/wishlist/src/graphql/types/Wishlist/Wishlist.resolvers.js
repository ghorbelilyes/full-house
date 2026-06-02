import { select, update } from '@evershop/postgres-query-builder';
import { buildUrl } from '@evershop/evershop/lib/router';
import { getConfig } from '@evershop/evershop/lib/util/getConfig';
import { camelCase } from '@evershop/evershop/lib/util/camelCase';

function getSessionCookieName() {
  return getConfig('system.session.cookieName', 'sid');
}

export default {
  Query: {
    myWishlist: async (_, __, context) => {
      try {
        const { signedCookies, customer, pool } = context;
        const storeCookieName = getSessionCookieName();
        const sessionID = signedCookies?.[storeCookieName];
        if (!sessionID) return null;

        let wishlist = await select()
          .from('wishlist')
          .where('status', '=', 1)
          .andWhere('sid', '=', sessionID)
          .load(pool);

        if (!wishlist && customer?.customer_id) {
          wishlist = await select()
            .from('wishlist')
            .where('status', '=', 1)
            .andWhere('customer_id', '=', customer.customer_id)
            .load(pool);

          if (wishlist) {
            await update('wishlist')
              .given({ sid: sessionID })
              .where('wishlist_id', '=', wishlist.wishlist_id)
              .execute(pool);
          }
        }

        if (!wishlist) return null;
        return camelCase(wishlist);
      } catch (e) {
        return null;
      }
    },

    wishlistProductIds: async (_, __, context) => {
      try {
        const { signedCookies, customer, pool } = context;
        const storeCookieName = getSessionCookieName();
        const sessionID = signedCookies?.[storeCookieName];
        if (!sessionID) return [];

        let wishlist = await select()
          .from('wishlist')
          .where('status', '=', 1)
          .andWhere('sid', '=', sessionID)
          .load(pool);

        if (!wishlist && customer?.customer_id) {
          wishlist = await select()
            .from('wishlist')
            .where('status', '=', 1)
            .andWhere('customer_id', '=', customer.customer_id)
            .load(pool);
        }

        if (!wishlist) return [];

        const items = await select('product_id')
          .from('wishlist_item')
          .where('wishlist_id', '=', wishlist.wishlist_id)
          .execute(pool);

        return items.map((i) => i.product_id);
      } catch (e) {
        return [];
      }
    }
  },

  Wishlist: {
    items: async (wishlist, _, { pool }) => {
      const items = await select()
        .from('wishlist_item')
        .where('wishlist_id', '=', wishlist.wishlistId)
        .execute(pool);
      return items.map((item) => camelCase(item));
    },
    itemCount: async (wishlist, _, { pool }) => {
      const items = await select('wishlist_item_id')
        .from('wishlist_item')
        .where('wishlist_id', '=', wishlist.wishlistId)
        .execute(pool);
      return items.length;
    },
    addItemApi: () => buildUrl('addWishlistItem'),
    toggleItemApi: () => buildUrl('toggleWishlistItem')
  },

  WishlistItem: {
    productUrl: async (item, _, { pool }) => {
      // Get full SEO path from url_rewrite
      const product = await select('uuid')
        .from('product')
        .where('product_id', '=', item.productId)
        .load(pool);
      if (!product) return null;
      const rewrite = await select('request_path')
        .from('url_rewrite')
        .where('entity_uuid', '=', product.uuid)
        .andWhere('entity_type', '=', 'product')
        .load(pool);
      return rewrite?.request_path || null;
    },
    removeApi: (item) =>
      buildUrl('removeWishlistItem', { product_id: item.productId }),
    thumbnail: (item) => {
      if (!item.thumbnail) return null;
      // Return the image path for the img src (will be served by the app)
      return item.thumbnail;
    }
  }
};
