import { getLegacyThemeConfig } from '../../../../../lib/branding/getBrandConfig.js';

export default {
  Query: {
    themeConfig: () => getLegacyThemeConfig()
  }
};
