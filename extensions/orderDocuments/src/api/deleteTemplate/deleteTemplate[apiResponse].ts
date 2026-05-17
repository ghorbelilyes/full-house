import { select, del } from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';

export default async function deleteTemplateHandler(request: any, response: any) {
  try {
    const { id } = request.params;

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

    await del('document_template')
      .where('uuid', '=', id)
      .execute(pool);

    response.status(200);
    response.$body = {
      data: { success: true }
    };
  } catch (error: any) {
    console.error('Error deleting template:', error);
    response.status(500).json({
      success: false,
      message: `Erreur : ${error.message}`
    });
  }
}
