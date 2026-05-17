import { getAdminSettingsResponse } from '../../services/settings.js';
import {
  NOTIFICATION_DEFINITIONS,
  NOTIFICATION_TYPES
} from '../../services/constants.js';

export default async function getSettings(request, response) {
  try {
    const payload = await getAdminSettingsResponse();
    response.json({
      ...payload,
      notificationTypes: NOTIFICATION_TYPES,
      definitions: NOTIFICATION_DEFINITIONS
    });
  } catch (e) {
    response.status(500).json({
      error: {
        message: e.message
      }
    });
  }
}
