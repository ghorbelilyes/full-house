/**
 * Scrapes a supplier/official product page and extracts structured data:
 *  - JSON-LD Product schema
 *  - Open Graph / meta tags
 *  - Title, description, images, videos, specification tables
 */
import * as cheerio from 'cheerio';

export interface ScrapedProduct {
  url: string;
  title: string;
  metaDescription: string;
  shortDescription: string;
  htmlDescription: string;
  images: string[];
  videos: string[];
  specs: Record<string, string>;
  brand: string;
  price: string;
  currency: string;
  sku: string;
  jsonLd: Record<string, any> | null;
}

// Domains known to block basic fetches — we add extra headers
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export async function scrapeProductPage(url: string): Promise<ScrapedProduct> {
  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('URL invalide. Veuillez fournir une URL complète (https://...)');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Seules les URLs HTTP/HTTPS sont acceptées');
  }

  // Fetch the page
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5'
      },
      signal: controller.signal,
      redirect: 'follow'
    });
    if (!res.ok) {
      throw new Error(`La page a retourné un statut ${res.status}`);
    }
    html = await res.text();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Délai d\'attente dépassé pour le chargement de la page (30 s)');
    }
    throw new Error(`Impossible de charger la page : ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);

  // ── JSON-LD extraction ──
  let jsonLd: Record<string, any> | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of candidates) {
        if (
          item['@type'] === 'Product' ||
          item['@type']?.includes?.('Product')
        ) {
          jsonLd = item;
          return false; // break
        }
        // Handle @graph
        if (item['@graph']) {
          const product = item['@graph'].find(
            (g: any) =>
              g['@type'] === 'Product' || g['@type']?.includes?.('Product')
          );
          if (product) {
            jsonLd = product;
            return false;
          }
        }
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  });

  // ── Title ──
  const title =
    jsonLd?.name ||
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    '';

  // ── Meta description ──
  const metaDescription =
    jsonLd?.description ||
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';

  // ── Short description ──
  // Look for common short-description containers
  const shortDesc =
    $('.short-description, .product-short-description, [itemprop="description"]')
      .first()
      .text()
      .trim() || '';

  // ── Full HTML description ──
  // Try multiple common selectors
  const descSelectors = [
    '#description',
    '.product-description',
    '.description-content',
    '[itemprop="description"]',
    '#tab-description',
    '.tab-content .description',
    '.product-detail-description',
    '.product__description'
  ];
  let htmlDescription = '';
  for (const sel of descSelectors) {
    const el = $(sel).first();
    if (el.length && el.html()) {
      htmlDescription = el.html()!.trim();
      break;
    }
  }

  // ── Images ──
  const images: string[] = [];
  const seenImages = new Set<string>();

  // JSON-LD images
  if (jsonLd?.image) {
    const ldImages = Array.isArray(jsonLd.image)
      ? jsonLd.image
      : [jsonLd.image];
    for (const img of ldImages) {
      const src = typeof img === 'string' ? img : img?.url || img?.contentUrl;
      if (src && !seenImages.has(src)) {
        seenImages.add(src);
        images.push(resolveUrl(url, src));
      }
    }
  }

  // OG image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage && !seenImages.has(ogImage)) {
    seenImages.add(ogImage);
    images.push(resolveUrl(url, ogImage));
  }

  // Gallery images
  $(
    '.product-gallery img, .product-images img, .product-media img, [data-gallery] img, .gallery img'
  ).each((_, el) => {
    const src =
      $(el).attr('data-src') ||
      $(el).attr('data-zoom-image') ||
      $(el).attr('data-large-src') ||
      $(el).attr('src');
    if (src && !seenImages.has(src) && !src.includes('placeholder')) {
      seenImages.add(src);
      images.push(resolveUrl(url, src));
    }
  });

  // ── Videos ──
  const videos: string[] = [];
  const seenVideos = new Set<string>();

  // JSON-LD video
  if (jsonLd?.video) {
    const ldVideos = Array.isArray(jsonLd.video)
      ? jsonLd.video
      : [jsonLd.video];
    for (const v of ldVideos) {
      const vUrl =
        typeof v === 'string' ? v : v?.contentUrl || v?.embedUrl || v?.url;
      if (vUrl && !seenVideos.has(vUrl)) {
        seenVideos.add(vUrl);
        videos.push(vUrl);
      }
    }
  }

  // Iframes (YouTube, Vimeo, etc.)
  $('iframe').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (
      src &&
      !seenVideos.has(src) &&
      (src.includes('youtube') ||
        src.includes('youtu.be') ||
        src.includes('vimeo') ||
        src.includes('dailymotion') ||
        src.includes('wistia'))
    ) {
      seenVideos.add(src);
      videos.push(src);
    }
  });

  // Video elements
  $('video source, video').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !seenVideos.has(src)) {
      seenVideos.add(src);
      videos.push(resolveUrl(url, src));
    }
  });

  // ── Specifications ──
  const specs: Record<string, string> = {};

  // Try standard spec tables
  $(
    '.specifications table tr, .product-specs table tr, .spec-table tr, [class*="spec"] table tr, .features-list tr, .product-attributes tr'
  ).each((_, el) => {
    const cells = $(el).find('td, th');
    if (cells.length >= 2) {
      const key = $(cells[0]).text().trim();
      const val = $(cells[1]).text().trim();
      if (key && val && key.length < 100 && val.length < 500) {
        specs[key] = val;
      }
    }
  });

  // Try dl > dt/dd pairs
  $(
    '.specifications dl, .product-specs dl, [class*="spec"] dl'
  ).each((_, dl) => {
    $(dl)
      .find('dt')
      .each((_, dt) => {
        const key = $(dt).text().trim();
        const dd = $(dt).next('dd');
        const val = dd.text().trim();
        if (key && val) {
          specs[key] = val;
        }
      });
  });

  // JSON-LD additionalProperty
  if (jsonLd?.additionalProperty) {
    for (const prop of jsonLd.additionalProperty) {
      if (prop.name && prop.value) {
        specs[prop.name] = String(prop.value);
      }
    }
  }

  // ── Brand, Price, SKU from JSON-LD ──
  const brand =
    (typeof jsonLd?.brand === 'string'
      ? jsonLd.brand
      : jsonLd?.brand?.name) || '';
  const priceOffer = jsonLd?.offers
    ? Array.isArray(jsonLd.offers)
      ? jsonLd.offers[0]
      : jsonLd.offers
    : null;
  const price = priceOffer?.price || '';
  const currency = priceOffer?.priceCurrency || '';
  const sku = jsonLd?.sku || jsonLd?.mpn || '';

  return {
    url,
    title,
    metaDescription,
    shortDescription: shortDesc,
    htmlDescription,
    images,
    videos,
    specs,
    brand,
    price: String(price),
    currency,
    sku: String(sku),
    jsonLd
  };
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}
