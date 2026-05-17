import { getEmailTemplates } from '../../services/templates.js';

export default async function getTemplates(request, response) {
  try {
    response.json({
      templates: await getEmailTemplates()
    });
  } catch (e) {
    response.status(500).json({
      error: {
        message: e.message
      }
    });
  }
}
