import { getAdminAiDescriptionSettingsResponse } from '../../services/settings.js';

export default async function getSettings(request, response) {
  try {
    response.json(await getAdminAiDescriptionSettingsResponse());
  } catch (e) {
    response.status(500).json({
      error: {
        message: e.message
      }
    });
  }
}
