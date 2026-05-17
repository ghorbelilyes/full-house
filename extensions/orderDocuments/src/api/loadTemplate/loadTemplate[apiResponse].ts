import { select } from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'templates');

export default async function loadTemplateHandler(request: any, response: any) {
  try {
    const { id } = request.params;

    // Check if id is a built-in type name (for loading defaults)
    const builtInTypes = ['facture', 'bon_commande', 'bon_livraison', 'default'];
    if (builtInTypes.includes(id)) {
      const filePath = path.join(TEMPLATES_DIR, `${id}.html`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        response.status(200).json({
          data: {
            template: {
              uuid: null,
              type: id === 'default' ? 'facture' : id,
              name: `Modèle par défaut — ${id}`,
              content,
              is_default: false,
              is_builtin: true
            }
          }
        });
        return;
      }
    }

    // Load from DB
    const template = await select()
      .from('document_template')
      .where('uuid', '=', id)
      .load(pool);

    if (!template) {
      response.status(404).json({
        success: false,
        message: 'Modèle introuvable'
      });
      return;
    }

    response.status(200).json({
      data: { template }
    });
  } catch (error: any) {
    console.error('Error loading template:', error);
    response.status(500).json({
      success: false,
      message: `Erreur : ${error.message}`
    });
  }
}
