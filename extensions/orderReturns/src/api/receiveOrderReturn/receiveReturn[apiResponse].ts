import { receiveOrderReturn } from '../../services/orderReturn.js';

export default async function receiveReturn(request, response) {
  try {
    const result = await receiveOrderReturn(request.params.id, {
      reason: request.body.reason,
      markRefunded:
        request.body.mark_refunded === true ||
        request.body.mark_refunded === 'true' ||
        request.body.mark_refunded === '1'
    });
    return response.json({ data: result });
  } catch (error) {
    return response.status(400).json({
      error: {
        message:
          error instanceof Error ? error.message : 'Erreur lors du retour reçu'
      }
    });
  }
}
