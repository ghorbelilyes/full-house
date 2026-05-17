import {
  getAdminAiDescriptionSettingsResponse,
  saveAiDescriptionSettings
} from '../../services/settings.js';

export default async function saveSettings(request, response) {
  try {
    await saveAiDescriptionSettings(request.body || {});
    response.json({
      data: await getAdminAiDescriptionSettingsResponse()
    });
  } catch (e) {
    response.status(400).json({
      error: {
        message: e.message
      }
    });
  }
}
