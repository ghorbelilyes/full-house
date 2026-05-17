/**
 * POST /admin/api/ai/generate-description
 *
 * Accepts a supplier/product URL, scrapes it, calls AI, and returns
 * structured data ready for the product form (EditorJS Row[] format).
 */
import { scrapeProductPage } from '../../services/scrapeProductPage.js';
import { callAiProvider } from '../../services/callAiProvider.js';
import { mapToEditorRows } from '../../services/mapToEditorRows.js';
import { downloadImages } from '../../services/downloadImage.js';
import { getEffectiveAiDescriptionSettings } from '../../services/settings.js';

export default async function generate(request, response) {
  const { url, tone, category, notes, language, download_images } = request.body;

  if (!url || typeof url !== 'string') {
    response.status(400);
    return response.json({
      success: false,
      message: 'Le champ « url » est requis.'
    });
  }

  try {
    const settings = await getEffectiveAiDescriptionSettings();

    // ── Step 1: Scrape the source page ──
    const scraped = await scrapeProductPage(url);

    // ── Step 2: Call AI to generate content ──
    const aiResult = await callAiProvider({
      scraped,
      tone: tone || settings.defaultTone,
      category: category || undefined,
      notes: notes || undefined,
      language: language || 'fr'
    }, settings);

    // ── Step 3: Optionally download images to local media ──
    let localImagePaths: string[] = [];
    if (download_images ?? settings.downloadImages) {
      const imagesToDownload = aiResult.gallery_images?.length
        ? aiResult.gallery_images
        : scraped.images;
      localImagePaths = await downloadImages(imagesToDownload, 8);
    }

    // ── Step 4: Convert AI output to EditorJS Row[] format ──
    const descriptionRows = mapToEditorRows(aiResult, localImagePaths);

    // ── Step 5: Return the complete result ──
    return response.json({
      success: true,
      data: {
        name: aiResult.name,
        short_description: aiResult.short_description || '',
        url_key: aiResult.url_key || '',
        meta_title: aiResult.meta_title || '',
        meta_description: aiResult.meta_description || '',
        description: descriptionRows,
        downloaded_images: localImagePaths,
        source_data: {
          original_title: scraped.title,
          original_url: scraped.url,
          specs_found: Object.keys(scraped.specs).length > 0,
          videos_found: scraped.videos.length > 0,
          images_count: scraped.images.length,
          brand: scraped.brand,
          sku: scraped.sku
        }
      }
    });
  } catch (err: any) {
    response.status(500);
    return response.json({
      success: false,
      message: err.message || 'Erreur interne lors de la génération.'
    });
  }
}
