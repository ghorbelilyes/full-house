import { error } from '@evershop/evershop/lib/log';
import { getEffectiveEmailNotificationSettings } from '../../services/settings.js';
import { loadOrderTemplateData } from '../../services/data.js';
import { sendNotificationEmail } from '../../services/emailService.js';

export default async function sendPaymentStatusEmail(data) {
  try {
    const orderId = Number(data.orderId);
    if (!orderId) return;

    const settings = await getEffectiveEmailNotificationSettings();
    const templateData = await loadOrderTemplateData(orderId, settings, {
      paymentStatus: data.after
    });
    if (!templateData?.customerEmail) return;

    await sendNotificationEmail({
      notificationType: 'payment_status_changed',
      to: templateData.customerEmail,
      data: templateData,
      eventKey: `order:${orderId}:payment_status_changed:${data.after}`,
      relatedOrderId: orderId
    });
  } catch (e) {
    error(e);
  }
}
