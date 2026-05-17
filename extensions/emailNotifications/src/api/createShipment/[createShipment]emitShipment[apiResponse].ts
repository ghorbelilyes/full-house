import { pool } from '@evershop/evershop/lib/postgres';
import { error } from '@evershop/evershop/lib/log';

export default async function emitShipmentCreated(request, response, next) {
  try {
    const shipment = response.$body?.data;
    if (shipment?.shipment_id) {
      await pool.query('INSERT INTO event (name, data) VALUES ($1, $2)', [
        'shipment_created',
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
