import { insert, update, select, execute } from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';

const VALID_TYPES = ['facture', 'bon_commande', 'bon_livraison'];

/**
 * Reverse the HTML-escape applied globally by EverShop's escapePayload middleware.
 */
function unescapeHtml(str: string): string {
  return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
}

export default async function saveTemplateHandler(request: any, response: any) {
  try {
    let { uuid, type, name, content, is_default } = request.body;
    // The global escapePayload middleware escapes HTML tags in POST body strings.
    // We need the raw HTML template, so unescape it.
    if (typeof content === 'string') {
      content = unescapeHtml(content);
    }

    if (!type || !VALID_TYPES.includes(type)) {
      response.status(400).json({
        success: false,
        message: `Type invalide. Types valides : ${VALID_TYPES.join(', ')}`
      });
      return;
    }

    if (!name || !content) {
      response.status(400).json({
        success: false,
        message: 'Le nom et le contenu sont requis'
      });
      return;
    }

    let template;

    if (uuid) {
      // Update existing
      const existing = await select()
        .from('document_template')
        .where('uuid', '=', uuid)
        .load(pool);

      if (!existing) {
        response.status(404).json({
          success: false,
          message: 'Modèle introuvable'
        });
        return;
      }

      // If setting as default, unset other defaults for this type
      if (is_default) {
        await execute(
          pool,
          `UPDATE "document_template" SET "is_default" = FALSE WHERE "type" = $1 AND "uuid" != $2`,
          [type, uuid]
        );
      }

      await update('document_template')
        .given({
          name,
          content,
          type,
          is_default: is_default ? true : false,
          updated_at: new Date().toISOString()
        })
        .where('uuid', '=', uuid)
        .execute(pool);

      template = await select()
        .from('document_template')
        .where('uuid', '=', uuid)
        .load(pool);
    } else {
      // Create new
      // If setting as default, unset other defaults for this type
      if (is_default) {
        await execute(
          pool,
          `UPDATE "document_template" SET "is_default" = FALSE WHERE "type" = $1`,
          [type]
        );
      }

      template = await insert('document_template')
        .given({
          name,
          content,
          type,
          is_default: is_default ? true : false
        })
        .execute(pool);
    }

    response.status(200);
    response.$body = {
      data: {
        template
      }
    };
  } catch (error: any) {
    console.error('Error saving template:', error);
    response.status(500).json({
      success: false,
      message: `Erreur : ${error.message}`
    });
  }
}
