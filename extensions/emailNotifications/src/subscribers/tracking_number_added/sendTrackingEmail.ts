import { pool } from '@evershop/evershop/lib/postgres';
import { error } from '@evershop/evershop/lib/log';
import { getEffectiveEmailNotificationSettings } from '../../services/settings.js';
import { loadOrderTemplateData } from '../../services/data.js';
import { sendNotificationEmail } from '../../services/emailService.js';

export default async function sendTrackingEmail(data) {
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
    const trackingNumber = shipment.tracking_number || data.trackingNumber || '';
    const templateData = await loadOrderTemplateData(orderId, settings, {
      shipment,
      shippingCarrier: shipment.carrier || data.carrier,
      trackingNumber
    });
    if (!templateData?.customerEmail) return;

    await sendNotificationEmail({
      notificationType: 'tracking_number_added',
      to: templateData.customerEmail,
      data: templateData,
      eventKey: `shipment:${shipmentId}:tracking_number_added:${trackingNumber}`,
      relatedOrderId: orderId
    });
  } catch (e) {
    error(e);
  }
}
