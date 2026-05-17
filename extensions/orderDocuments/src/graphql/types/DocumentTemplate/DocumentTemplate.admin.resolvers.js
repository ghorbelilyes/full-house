import { select } from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', '..', 'templates');

const TYPE_LABELS = {
  facture: 'Facture',
  bon_commande: 'Bon de commande',
  bon_livraison: 'Bon de livraison'
};

export default {
  Query: {
    documentTemplates: async () => {
      try {
        const templates = await select()
          .from('document_template')
          .orderBy('type')
          .orderBy('name')
          .execute(pool);
        return (templates || []).map((t) => ({
          uuid: t.uuid,
          type: t.type,
          name: t.name,
          content: t.content,
          isDefault: t.is_default,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        }));
      } catch {
        return [];
      }
    },

    documentTemplateEdit: async (_, args, context) => {
      // Context is a plain object built from request.locals.context
      const uuid = context.editTemplateUuid || null;
      const type = context.editTemplateType || null;
      const from = context.editTemplateFrom || null;

      if (uuid) {
        const tpl = await select()
          .from('document_template')
          .where('uuid', '=', uuid)
          .load(pool);
        if (tpl) {
          return {
            uuid: tpl.uuid,
            type: tpl.type,
            name: tpl.name,
            content: tpl.content,
            isDefault: tpl.is_default,
            isNew: false,
            createdAt: tpl.created_at,
            updatedAt: tpl.updated_at
          };
        }
      }

      if (from === 'builtin' && type) {
        const filePath = path.join(TEMPLATES_DIR, `${type}.html`);
        let content = '';
        if (fs.existsSync(filePath)) {
          content = fs.readFileSync(filePath, 'utf-8');
        } else {
          const defaultPath = path.join(TEMPLATES_DIR, 'default.html');
          if (fs.existsSync(defaultPath)) {
            content = fs.readFileSync(defaultPath, 'utf-8');
          }
        }
        return {
          uuid: null,
          type,
          name: `${TYPE_LABELS[type] || type} — Personnalisé`,
          content,
          isDefault: false,
          isNew: true
        };
      }

      return null;
    }
  }
};
