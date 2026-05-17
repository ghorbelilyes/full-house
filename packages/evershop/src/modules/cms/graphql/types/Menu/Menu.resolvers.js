import { select } from '@evershop/postgres-query-builder';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';
import { getCmsPagesBaseQuery } from '../../../services/getCmsPagesBaseQuery.js';

export default {
  Query: {
    menu: async (root, _, { pool }) => {
      // Find the main menu widget (basic_menu with isMain enabled)
      const widgets = await select()
        .from('widget')
        .where('type', '=', 'basic_menu')
        .and('status', '=', true)
        .execute(pool);

      const mainWidget = widgets.find(
        (w) =>
          w.settings?.isMain &&
          [1, '1', 'true', true].includes(w.settings.isMain)
      );

      if (!mainWidget || !mainWidget.settings?.menus) {
        return { items: [] };
      }

      const menus = mainWidget.settings.menus;

      // Collect all category and page UUIDs to resolve URLs
      const categoryUuids = [];
      const pageUuids = [];
      const customUrls = [];

      const collectUuids = (items) => {
        for (const item of items) {
          if (item.type === 'category') categoryUuids.push(item.uuid);
          if (item.type === 'page') pageUuids.push(item.uuid);
          if (item.type === 'custom' && item.url && item.url !== '#') {
            customUrls.push(item.url);
          }
          if (item.children?.length) collectUuids(item.children);
        }
      };
      collectUuids(menus);

      // Resolve URLs
      let urls = [];
      let categories = [];
      let customCategoryRewrites = [];
      if (categoryUuids.length > 0) {
        const rewrites = await select()
          .from('url_rewrite')
          .where('entity_uuid', 'IN', categoryUuids)
          .execute(pool);
        urls = urls.concat(
          rewrites.map((r) => ({ uuid: r.entity_uuid, url: r.request_path }))
        );
      }
      if (customUrls.length > 0) {
        customCategoryRewrites = await select()
          .from('url_rewrite')
          .where('request_path', 'IN', customUrls)
          .and('entity_type', '=', 'category')
          .execute(pool);
      }

      const resolvedCategoryUuids = [
        ...new Set([
          ...categoryUuids,
          ...customCategoryRewrites.map((r) => r.entity_uuid)
        ])
      ];
      if (resolvedCategoryUuids.length > 0) {
        categories = await select('category_id', 'uuid')
          .from('category')
          .where('uuid', 'IN', resolvedCategoryUuids)
          .execute(pool);
      }
      if (pageUuids.length > 0) {
        const query = getCmsPagesBaseQuery();
        query.where('uuid', 'IN', pageUuids);
        const cmsPages = await query.execute(pool);
        urls = urls.concat(
          cmsPages.map((p) => ({
            uuid: p.uuid,
            url: buildUrl('cmsPageView', { url_key: p.url_key })
          }))
        );
      }

      const resolveUrl = (item) => {
        const found = urls.find((u) => u.uuid === item.uuid);
        return found ? found.url : item.type === 'custom' ? item.url || '#' : '#';
      };

      const resolveCategoryId = (item) => {
        let uuid = item.uuid;

        if (item.type === 'custom') {
          const rewrite = customCategoryRewrites.find(
            (r) => r.request_path === item.url
          );
          uuid = rewrite?.entity_uuid;
        }

        if (!uuid || (item.type !== 'category' && item.type !== 'custom')) {
          return null;
        }
        const found = categories.find((c) => c.uuid === uuid);
        return found ? found.category_id : null;
      };

      const mapItem = (item) => ({
        name: item.name,
        url: resolveUrl(item),
        type: item.type,
        uuid: item.uuid,
        categoryId: resolveCategoryId(item),
        children: (item.children || []).map(mapItem)
      });

      const items = menus.map(mapItem);

      return { items };
    }
  }
};
