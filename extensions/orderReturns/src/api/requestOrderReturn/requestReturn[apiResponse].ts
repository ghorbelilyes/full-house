import { requestOrderReturn } from '../../services/orderReturn.js';

export default async function requestReturn(request, response) {
  try {
    const { reason } = request.body;
    const result = await requestOrderReturn(request.params.id, reason);
    return response.json({ data: result });
  } catch (error) {
    return response.status(400).json({
      error: {
        message:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la demande de retour'
      }
    });
  }
}
