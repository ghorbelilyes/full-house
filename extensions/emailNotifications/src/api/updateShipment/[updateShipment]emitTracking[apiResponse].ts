import { pool } from '@evershop/evershop/lib/postgres';
import { error } from '@evershop/evershop/lib/log';

export default async function emitTrackingUpdated(request, response, next) {
  try {
    const shipment = response.$body?.data;
    const previous = request.locals?.emailNotificationsPreviousShipment;
    const trackingChanged =
      shipment?.tracking_number &&
      shipment.tracking_number !== previous?.tracking_number;
    const carrierChanged =
      shipment?.carrier && shipment.carrier !== previous?.carrier;

    if (shipment?.shipment_id && (trackingChanged || carrierChanged)) {
      await pool.query('INSERT INTO event (name, data) VALUES ($1, $2)', [
        'tracking_number_added',
        JSON.stringify({
          orderId: shipment.shipment_order_id,
          shipmentId: shipment.shipment_id,
          carrier: shipment.carrier || '',
          trackingNumber: shipment.tracking_number || ''
        })
      ]);
    }
  } catch (e) {
    error(e);
  }
  next();
}
