import fs from 'fs';
import path from 'path';
import { CONSTANTS } from '../helpers.js';
import { getConfig } from '../util/getConfig.js';

type BrandAsset = {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
};

type BrandConfigFile = {
  name?: string;
  content?: {
    storeName?: string;
    storeDescription?: string;
    copyRight?: string;
  };
  logos?: {
    store?: BrandAsset;
    admin?: BrandAsset;
    email?: BrandAsset;
  };
  icons?: {
    favicon?: string;
    appleTouch?: string;
    manifest?: string;
    browserConfig?: string;
    msTileImage?: string;
  };
  images?: {
    og?: string;
    twitter?: string;
  };
  theme?: {
    themeColor?: string;
    themeCssPath?: string;
  };
};

export type BrandConfig = {
  name: string;
  content: {
    storeName: string;
    storeDescription: string;
    copyRight: string;
  };
  logos: {
    store: BrandAsset;
    admin: BrandAsset;
    email: BrandAsset;
  };
  icons: {
    favicon?: string;
    appleTouch?: string;
    manifest?: string;
    browserConfig?: string;
    msTileImage?: string;
  };
  images: {
    og?: string;
    twitter?: string;
  };
  theme: {
    themeColor: string;
    themeCssPath: string;
  };
};

type LegacyThemeConfig = {
  logo?: BrandAsset;
  headTags?: {
    links?: Record<string, unknown>[];
    metas?: Record<string, unknown>[];
    scripts?: Record<string, unknown>[];
    bases?: Record<string, unknown>[];
    base?: Record<string, unknown>;
  };
  copyRight?: string;
};

const DEFAULT_BRAND_CONFIG: BrandConfig = {
  name: 'Store',
  content: {
    storeName: 'Store',
    storeDescription: 'Your store online catalog',
    copyRight: `© ${new Date().getFullYear()} Your Store. All rights reserved.`
  },
  logos: {
    store: {
      src: '/branding/store-logo.png',
      alt: 'Store',
      width: 320,
      height: 106
    },
    admin: {
      src: '/branding/admin-logo.png',
      alt: 'Store',
      width: 60,
      height: 60
    },
    email: {
      src: '/branding/email-logo.png',
      alt: 'Store',
      width: 200,
      height: 50
    }
  },
  icons: {
    favicon: '/branding/favicon.ico',
    appleTouch: '/branding/apple-touch-icon.png',
    manifest: '/branding/site.webmanifest',
    browserConfig: '/branding/browserconfig.xml',
    msTileImage: '/branding/mstile-150x150.png'
  },
  images: {
    og: '/branding/og-image.png',
    twitter: '/branding/twitter-card.png'
  },
  theme: {
    themeColor: '#0A1625',
    themeCssPath: 'branding/theme.css'
  }
};

let brandConfigCache: BrandConfig | undefined;

function normalizeAssetPath(src?: string): string | undefined {
  if (!src) {
    return undefined;
  }
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('/')) {
    return src;
  }
  return `/${src.replace(/^\/+/, '')}`;
}

function normalizeAsset(
  asset: BrandAsset | undefined,
  fallback: BrandAsset,
  fallbackAlt: string
): BrandAsset {
  return {
    src: normalizeAssetPath(asset?.src || fallback.src),
    alt: asset?.alt || fallback.alt || fallbackAlt,
    width: asset?.width ?? fallback.width,
    height: asset?.height ?? fallback.height
  };
}

function readBrandConfigFile(): BrandConfigFile {
  const configPath = path.resolve(CONSTANTS.BRANDINGPATH, 'config.json');
  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as BrandConfigFile;
  } catch {
    return {};
  }
}

export function getBrandConfig(): BrandConfig {
  if (brandConfigCache) {
    return brandConfigCache;
  }

  const fileConfig = readBrandConfigFile();
  const name = fileConfig.name || DEFAULT_BRAND_CONFIG.name;
  const storeName =
    fileConfig.content?.storeName || fileConfig.name || DEFAULT_BRAND_CONFIG.content.storeName;

  brandConfigCache = {
    name,
    content: {
      storeName,
      storeDescription:
        fileConfig.content?.storeDescription ||
        DEFAULT_BRAND_CONFIG.content.storeDescription,
      copyRight:
        fileConfig.content?.copyRight || DEFAULT_BRAND_CONFIG.content.copyRight
    },
    logos: {
      store: normalizeAsset(fileConfig.logos?.store, DEFAULT_BRAND_CONFIG.logos.store, storeName),
      admin: normalizeAsset(fileConfig.logos?.admin, DEFAULT_BRAND_CONFIG.logos.admin, storeName),
      email: normalizeAsset(fileConfig.logos?.email, DEFAULT_BRAND_CONFIG.logos.email, storeName)
    },
    icons: {
      favicon: normalizeAssetPath(
        fileConfig.icons?.favicon || DEFAULT_BRAND_CONFIG.icons.favicon
      ),
      appleTouch: normalizeAssetPath(
        fileConfig.icons?.appleTouch || DEFAULT_BRAND_CONFIG.icons.appleTouch
      ),
      manifest: normalizeAssetPath(
        fileConfig.icons?.manifest || DEFAULT_BRAND_CONFIG.icons.manifest
      ),
      browserConfig: normalizeAssetPath(
        fileConfig.icons?.browserConfig || DEFAULT_BRAND_CONFIG.icons.browserConfig
      ),
      msTileImage: normalizeAssetPath(
        fileConfig.icons?.msTileImage || DEFAULT_BRAND_CONFIG.icons.msTileImage
      )
    },
    images: {
      og: normalizeAssetPath(fileConfig.images?.og || DEFAULT_BRAND_CONFIG.images.og),
      twitter: normalizeAssetPath(
        fileConfig.images?.twitter || DEFAULT_BRAND_CONFIG.images.twitter
      )
    },
    theme: {
      themeColor:
        fileConfig.theme?.themeColor || DEFAULT_BRAND_CONFIG.theme.themeColor,
      themeCssPath:
        fileConfig.theme?.themeCssPath || DEFAULT_BRAND_CONFIG.theme.themeCssPath
    }
  };

  return brandConfigCache;
}

export function getBrandStoreNameFallback(): string {
  return getBrandConfig().content.storeName || getBrandConfig().name;
}

export function getBrandStoreDescriptionFallback(): string {
  return getBrandConfig().content.storeDescription;
}

export function getLegacyThemeConfig(): LegacyThemeConfig {
  const brandConfig = getBrandConfig();
  const themeConfig = getConfig('themeConfig', {} as LegacyThemeConfig);
  const headTags = themeConfig.headTags || {};

  const brandLinks = [];
  if (brandConfig.icons.appleTouch) {
    brandLinks.push({
      rel: 'apple-touch-icon',
      href: brandConfig.icons.appleTouch,
      sizes: '180x180'
    });
  }
  if (brandConfig.icons.manifest) {
    brandLinks.push({
      rel: 'manifest',
      href: brandConfig.icons.manifest
    });
  }

  const brandMetas = [];
  if (brandConfig.theme.themeColor) {
    brandMetas.push({
      name: 'theme-color',
      content: brandConfig.theme.themeColor
    });
    brandMetas.push({
      name: 'msapplication-TileColor',
      content: brandConfig.theme.themeColor
    });
  }
  if (brandConfig.icons.msTileImage) {
    brandMetas.push({
      name: 'msapplication-TileImage',
      content: brandConfig.icons.msTileImage
    });
  }
  if (brandConfig.icons.browserConfig) {
    brandMetas.push({
      name: 'msapplication-config',
      content: brandConfig.icons.browserConfig
    });
  }

  return {
    ...themeConfig,
    logo: normalizeAsset(
      themeConfig.logo,
      brandConfig.logos.store,
      brandConfig.content.storeName
    ),
    copyRight: brandConfig.content.copyRight || themeConfig.copyRight,
    headTags: {
      links: [...brandLinks, ...(headTags.links || [])],
      metas: [...brandMetas, ...(headTags.metas || [])],
      scripts: headTags.scripts || [],
      bases: headTags.bases || [],
      base: headTags.base || (headTags.bases && headTags.bases[0])
    }
  };
}
