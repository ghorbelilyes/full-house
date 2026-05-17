import { select } from '@evershop/postgres-query-builder';
import sanitizeHtml from 'sanitize-html';
import uniqid from 'uniqid';
import { error } from '../../../../../lib/log/logger.js';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';
import { camelCase } from '../../../../../lib/util/camelCase.js';
import { getEnabledWidgets } from '../../../../../lib/widget/widgetManager.js';
import { getCmsPagesBaseQuery } from '../../../services/getCmsPagesBaseQuery.js';
import { getWidgetsBaseQuery } from '../../../services/getWidgetsBaseQuery.js';
import { WidgetCollection } from '../../../services/WidgetCollection.js';

export default {
  Query: {
    widget: async (root, { id }, { pool }) => {
      const query = getWidgetsBaseQuery();
      query.where('widget_id', '=', id);
      const widget = await query.load(pool);
      return widget ? camelCase(widget) : null;
    },
    widgets: async (_, { filters = [] }, { user }) => {
      const query = getWidgetsBaseQuery();
      const root = new WidgetCollection(query);
      await root.init(filters, !!user);
      return root;
    },
    widgetTypes: () => {
      const types = getEnabledWidgets();
      return types.map((row) => ({
        code: row.type,
        name: row.name,
        description: row.description,
        settingComponent: row.settingComponent,
        component: row.component,
        defaultSettings: row.defaultSettings,
        createWidgetUrl: buildUrl('widgetNew', { type: row.type })
      }));
    },
    widgetType: (_, { code }) => {
      const types = getEnabledWidgets();
      const type = types.find((row) => row.type === code);
      return type
        ? {
            code: type.type,
            name: type.name,
            description: type.description,
            settingComponent: type.settingComponent,
            component: type.component,
            defaultSettings: type.defaultSettings,
            createWidgetUrl: buildUrl('widgetNew', { type: type.type })
          }
        : null;
    },
    textWidget(_, { text, className }) {
      try {
        if (!text) {
          return { text: [], className };
        }
        const json = JSON.parse(text);
        return {
          text: json,
          className
        };
      } catch (e) {
        error(e);
        return { text: [], className };
      }
    },
    bannerWidget(_, { src, alignment, width, height, alt }) {
      return { src, alignment, width, height, alt };
    },
    slideshowWidget(
      _,
      {
        slides,
        autoplay,
        autoplaySpeed,
        arrows,
        dots,
        fullWidth,
        widthValue,
        heightValue,
        heightType
      }
    ) {
      return {
        slides: slides || [],
        autoplay: autoplay !== undefined ? autoplay : true,
        autoplaySpeed: autoplaySpeed || 3000,
        arrows: arrows !== undefined ? arrows : true,
        dots: dots !== undefined ? dots : true,
        fullWidth: fullWidth !== undefined ? fullWidth : true,
        widthValue: widthValue || 1920,
        heightValue: heightValue || 800,
        heightType: heightType || 'auto'
      };
    },
    basicMenuWidget: async (_, { settings }, { pool }) => {
      const categories = [];
      const pages = [];
      const menus = settings?.menus || undefined;
      const isMain = [1, '1', 'true', true].includes(settings?.isMain) || false;
      if (!menus) {
        return { menus: [] };
      }

      // Recursively collect all category/page UUIDs at any depth
      const collectUuids = (items) => {
        for (const item of items) {
          if (item.type === 'category') categories.push(item.uuid);
          if (item.type === 'page') pages.push(item.uuid);
          if (item.children && item.children.length > 0) {
            collectUuids(item.children);
          }
        }
      };
      collectUuids(menus);

      let urls = [];
      if (categories.length > 0) {
        const rewrites = await select()
          .from('url_rewrite')
          .where('entity_uuid', 'IN', categories)
          .execute(pool);
        urls = urls.concat(
          rewrites.map((r) => ({
            uuid: r.entity_uuid,
            url: r.request_path
          }))
        );
      }
      if (pages.length > 0) {
        const query = getCmsPagesBaseQuery();
        query.where('uuid', 'IN', pages);
        const cmsPages = await query.execute(pool);
        urls = urls.concat(
          cmsPages.map((p) => ({
            uuid: p.uuid,
            url: buildUrl('cmsPageView', { url_key: p.url_key })
          }))
        );
      }

      // Recursively map items with resolved URLs
      const mapItem = (item) => {
        const found = urls.find((u) => u.uuid === item.uuid);
        return {
          ...item,
          id: uniqid(),
          url: found ? found.url : item.type === 'custom' ? item.url : null,
          children: (item.children || []).map(mapItem)
        };
      };

      const items = menus.map(mapItem);
      return { menus: items, isMain, className: settings?.className };
    }
  },
  Widget: {
    editUrl: ({ uuid }) => buildUrl('widgetEdit', { id: uuid }),
    updateApi: (widget) => buildUrl('updateWidget', { id: widget.uuid }),
    deleteApi: (widget) => buildUrl('deleteWidget', { id: widget.uuid })
  }
};
