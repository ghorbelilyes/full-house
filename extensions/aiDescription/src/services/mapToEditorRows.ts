/**
 * Converts AI-generated sections into the EverShop EditorJS Row[] format.
 *
 * Format:
 *  Row[] = [
 *    {
 *      id: "r__<uuid>",
 *      size: 1,              // grid column count for the row
 *      columns: [{
 *        id: "c__<uuid>",
 *        size: 1,
 *        data: {             // EditorJS document
 *          time: number,
 *          version: "2.30.2",
 *          blocks: [{ id, type, data }]
 *        }
 *      }]
 *    }
 *  ]
 *
 * Supported EditorJS block types:
 *   paragraph  → { text: string }
 *   header     → { text: string, level: 2|3|4 }
 *   list       → { style: "unordered"|"ordered", items: string[] }
 *   image      → { file: { url }, caption, withBorder, withBackground, stretched }
 *   raw        → { html: string }
 *   quote      → { text: string, caption: string }
 */
import type { AiGeneratedProduct, AiSection } from './callAiProvider.js';

// Simple UUID v4 substitute (avoids importing uuid on server)
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function blockId(): string {
  // EditorJS uses 10-char alphanumeric IDs
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

interface EditorBlock {
  id: string;
  type: string;
  data: Record<string, any>;
}

interface Row {
  id: string;
  size: number;
  columns: {
    id: string;
    size: number;
    data: {
      time: number;
      version: string;
      blocks: EditorBlock[];
    };
  }[];
}

/**
 * Converts a section into EditorJS blocks.
 */
function sectionToBlocks(section: AiSection): EditorBlock[] {
  const blocks: EditorBlock[] = [];

  // Add heading if present
  if (section.heading) {
    blocks.push({
      id: blockId(),
      type: 'header',
      data: { text: section.heading, level: 2 }
    });
  }

  switch (section.type) {
    case 'introduction':
    case 'paragraph': {
      const s = section as { content: string };
      if (s.content) {
        blocks.push({
          id: blockId(),
          type: 'paragraph',
          data: { text: s.content }
        });
      }
      break;
    }

    case 'features': {
      const s = section as { items: string[] };
      if (s.items && s.items.length > 0) {
        blocks.push({
          id: blockId(),
          type: 'list',
          data: { style: 'unordered', items: s.items }
        });
      }
      break;
    }

    case 'specifications': {
      const s = section as { specs: Record<string, string> };
      if (s.specs && Object.keys(s.specs).length > 0) {
        // Render specs as an HTML table in a raw block for clean formatting
        const rows = Object.entries(s.specs)
          .map(
            ([key, val]) =>
              `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap">${escapeHtml(key)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563">${escapeHtml(val)}</td></tr>`
          )
          .join('');
        const html = `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><tbody>${rows}</tbody></table>`;
        blocks.push({
          id: blockId(),
          type: 'raw',
          data: { html }
        });
      }
      break;
    }
  }

  return blocks;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Creates a single-column row containing the given blocks.
 */
function makeRow(blocks: EditorBlock[]): Row {
  return {
    id: `r__${uuid()}`,
    size: 1,
    columns: [
      {
        id: `c__${uuid()}`,
        size: 1,
        data: {
          time: Date.now(),
          version: '2.30.2',
          blocks
        }
      }
    ]
  };
}

/**
 * Creates a two-column row (e.g., for image + text side by side).
 */
function makeTwoColumnRow(
  leftBlocks: EditorBlock[],
  rightBlocks: EditorBlock[]
): Row {
  return {
    id: `r__${uuid()}`,
    size: 2,
    columns: [
      {
        id: `c__${uuid()}`,
        size: 1,
        data: {
          time: Date.now(),
          version: '2.30.2',
          blocks: leftBlocks
        }
      },
      {
        id: `c__${uuid()}`,
        size: 1,
        data: {
          time: Date.now(),
          version: '2.30.2',
          blocks: rightBlocks
        }
      }
    ]
  };
}

/**
 * Main mapper: converts AI output → EditorJS Row[] ready for the product description field.
 */
export function mapToEditorRows(
  ai: AiGeneratedProduct,
  localImagePaths: string[]
): Row[] {
  const rows: Row[] = [];

  // ── 1. Content sections ──
  for (const section of ai.sections) {
    const blocks = sectionToBlocks(section);
    if (blocks.length > 0) {
      rows.push(makeRow(blocks));
    }
  }

  // ── 2. Inline images (if any were downloaded) ──
  // Insert images in pairs as two-column rows for a professional look
  if (localImagePaths.length > 0) {
    // Add a heading row
    rows.push(
      makeRow([
        {
          id: blockId(),
          type: 'header',
          data: { text: 'Galerie', level: 2 }
        }
      ])
    );

    for (let i = 0; i < localImagePaths.length; i += 2) {
      const leftImage: EditorBlock = {
        id: blockId(),
        type: 'image',
        data: {
          file: { url: localImagePaths[i] },
          caption: '',
          withBorder: false,
          withBackground: false,
          stretched: true
        }
      };

      if (i + 1 < localImagePaths.length) {
        const rightImage: EditorBlock = {
          id: blockId(),
          type: 'image',
          data: {
            file: { url: localImagePaths[i + 1] },
            caption: '',
            withBorder: false,
            withBackground: false,
            stretched: true
          }
        };
        rows.push(makeTwoColumnRow([leftImage], [rightImage]));
      } else {
        rows.push(makeRow([leftImage]));
      }
    }
  }

  // ── 3. Video embeds ──
  if (ai.video_embeds && ai.video_embeds.length > 0) {
    const videoBlocks: EditorBlock[] = [
      {
        id: blockId(),
        type: 'header',
        data: { text: 'Vidéo', level: 2 }
      }
    ];

    for (const videoUrl of ai.video_embeds) {
      const embedUrl = normalizeVideoEmbedUrl(videoUrl);
      videoBlocks.push({
        id: blockId(),
        type: 'raw',
        data: {
          html: `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px"><iframe src="${escapeHtml(embedUrl)}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
        }
      });
    }

    rows.push(makeRow(videoBlocks));
  }

  return rows;
}

/**
 * Normalizes a video URL to an embeddable format.
 */
function normalizeVideoEmbedUrl(url: string): string {
  // YouTube watch → embed
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Vimeo → embed
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
}
