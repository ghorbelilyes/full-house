import { saveEmailNotificationSettings } from '../../services/settings.js';

export default async function saveSettings(request, response) {
  try {
    const settings = await saveEmailNotificationSettings(request.body || {});
    response.json({
      data: {
        settings
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
