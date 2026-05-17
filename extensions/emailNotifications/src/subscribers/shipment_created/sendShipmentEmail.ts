import { pool } from '@evershop/evershop/lib/postgres';
import { error } from '@evershop/evershop/lib/log';
import { getEffectiveEmailNotificationSettings } from '../../services/settings.js';
import { loadOrderTemplateData } from '../../services/data.js';
import { sendNotificationEmail } from '../../services/emailService.js';

export default async function sendShipmentEmail(data) {
  try {
    const orderId = Number(data.orderId);
    const shipmentId = Number(data.shipmentId);
    if (!orderId || !shipmentId) return;

    const settings = await getEffectiveEmailNotificationSettings();
    const shipmentResult = await pool.query(
      'SELECT * FROM shipment WHERE shipment_id = $1',
      [shipmentId]
    );
    const shipment = shipmentResult.rows[0] || {};
    const templateData = await loadOrderTemplateData(orderId, settings, {
      shipment,
      shippingCarrier: shipment.carrier || data.carrier,
      trackingNumber: shipment.tracking_number || data.trackingNumber
    });
    if (!templateData?.customerEmail) return;

    await sendNotificationEmail({
      notificationType: 'shipment_created',
      to: templateData.customerEmail,
      data: templateData,
      eventKey: `order:${orderId}:shipment_created:${shipmentId}`,
      relatedOrderId: orderId
    });
  } catch (e) {
    error(e);
  }
}
