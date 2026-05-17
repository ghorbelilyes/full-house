import { getRecentEmailLogs } from '../../services/logs.js';

export default async function getLogs(request, response) {
  try {
    response.json({
      logs: await getRecentEmailLogs(request.query?.limit || 25)
    });
  } catch (e) {
    response.status(500).json({
      error: {
        message: e.message
      }
    });
  }
}
