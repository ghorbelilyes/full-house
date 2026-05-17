import { saveEmailTemplate } from '../../services/templates.js';

export default async function saveTemplate(request, response) {
  try {
    response.json({
      data: {
        template: await saveEmailTemplate(request.body || {})
      }
    });
  } catch (e) {
    response.status(400).json({
      error: {
        message: e.message
      }
    });
  }
}
