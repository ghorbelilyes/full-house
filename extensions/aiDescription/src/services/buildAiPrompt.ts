/**
 * Builds the system + user prompt for the AI product description generator.
 */
import type { ScrapedProduct } from './scrapeProductPage.js';

export interface AiPromptOptions {
  scraped: ScrapedProduct;
  tone?: string;
  category?: string;
  notes?: string;
  language?: string;
}

export function buildSystemPrompt(): string {
  return `Tu es un rédacteur e-commerce professionnel spécialisé dans la rédaction de fiches produit pour une boutique en ligne tunisienne.

RÈGLES ABSOLUES :
1. Écris UNIQUEMENT en français.
2. Ne copie JAMAIS le texte source mot pour mot. Reformule intégralement.
3. N'invente AUCUNE spécification technique, garantie, certification, compatibilité, tension électrique, dimension, poids, stock ou prix qui ne figure pas dans les données source.
4. Si une information technique n'est pas dans la source, ne l'inclus pas.
5. Le ton doit être professionnel, persuasif et orienté conversion.
6. Optimise pour le SEO : mots-clés naturels, titres structurés, méta-description engageante.
7. La description doit mettre en avant les bénéfices client, pas seulement les caractéristiques.

FORMAT DE SORTIE — JSON strict (pas de markdown, pas de commentaires) :
{
  "name": "Nom du produit optimisé pour le SEO (max 80 caractères)",
  "short_description": "Description courte persuasive (2-3 phrases, max 200 caractères)",
  "url_key": "cle-url-en-minuscules-avec-tirets",
  "meta_title": "Titre SEO optimisé (max 60 caractères)",
  "meta_description": "Méta description SEO engageante (max 155 caractères)",
  "sections": [
    {
      "type": "introduction",
      "heading": "Titre de la section (h2)",
      "content": "Paragraphe HTML. Peut contenir <strong>, <em>, <br>. PAS de balises block."
    },
    {
      "type": "features",
      "heading": "Points Forts",
      "items": ["Avantage 1", "Avantage 2", "..."]
    },
    {
      "type": "specifications",
      "heading": "Caractéristiques Techniques",
      "specs": { "Clé": "Valeur", "...": "..." }
    },
    {
      "type": "paragraph",
      "heading": "Titre optionnel",
      "content": "Texte additionnel..."
    }
  ],
  "gallery_images": ["url1", "url2"],
  "video_embeds": ["youtube_or_vimeo_embed_url"]
}

NOTES SUR LES SECTIONS :
- « introduction » : toujours en premier, paragraphe accrocheur.
- « features » : liste à puces des avantages (3-8 items).
- « specifications » : SEULEMENT les specs trouvées dans la source. N'en invente pas.
- « paragraph » : sections additionnelles si le produit est riche en contenu.
- Tu peux ajouter plusieurs sections « paragraph » pour du contenu long.
- gallery_images : retourne uniquement les URLs d'images trouvées dans la source, dans l'ordre de pertinence.
- video_embeds : retourne uniquement les URLs d'embed vidéo trouvées dans la source (YouTube, Vimeo). Si aucune vidéo n'est trouvée, retourne un tableau vide.

Retourne UNIQUEMENT le JSON, sans aucun texte avant ou après.`;
}

export function buildUserPrompt(options: AiPromptOptions): string {
  const { scraped, tone, category, notes } = options;

  const parts: string[] = [];

  parts.push(`URL source : ${scraped.url}`);
  parts.push(`Titre original : ${scraped.title}`);

  if (scraped.brand) {
    parts.push(`Marque : ${scraped.brand}`);
  }
  if (scraped.sku) {
    parts.push(`Référence/SKU : ${scraped.sku}`);
  }
  if (scraped.price) {
    parts.push(`Prix source : ${scraped.price} ${scraped.currency}`);
  }
  if (scraped.metaDescription) {
    parts.push(`Méta-description source : ${scraped.metaDescription}`);
  }
  if (scraped.shortDescription) {
    parts.push(`Description courte source : ${scraped.shortDescription}`);
  }
  if (scraped.htmlDescription) {
    // Truncate very long descriptions to avoid token waste
    const truncated =
      scraped.htmlDescription.length > 8000
        ? scraped.htmlDescription.slice(0, 8000) + '...[tronqué]'
        : scraped.htmlDescription;
    parts.push(`Description HTML source :\n${truncated}`);
  }

  if (Object.keys(scraped.specs).length > 0) {
    parts.push(
      `Spécifications techniques trouvées :\n${Object.entries(scraped.specs)
        .map(([k, v]) => `  - ${k}: ${v}`)
        .join('\n')}`
    );
  }

  if (scraped.images.length > 0) {
    parts.push(
      `Images trouvées (${scraped.images.length}) :\n${scraped.images
        .slice(0, 15)
        .map((u, i) => `  ${i + 1}. ${u}`)
        .join('\n')}`
    );
  }

  if (scraped.videos.length > 0) {
    parts.push(
      `Vidéos trouvées (${scraped.videos.length}) :\n${scraped.videos
        .map((u, i) => `  ${i + 1}. ${u}`)
        .join('\n')}`
    );
  }

  // Optional admin inputs
  if (tone) parts.push(`Ton souhaité : ${tone}`);
  if (category) parts.push(`Catégorie produit : ${category}`);
  if (notes) parts.push(`Notes supplémentaires de l'administrateur : ${notes}`);

  parts.push(
    `\nGénère maintenant la fiche produit complète en JSON selon le format demandé.`
  );

  return parts.join('\n\n');
}
