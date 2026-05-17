import { error } from '@evershop/evershop/lib/log';
import { getEffectiveEmailNotificationSettings } from '../../services/settings.js';
import { loadOrderTemplateData } from '../../services/data.js';
import { sendNotificationEmail } from '../../services/emailService.js';

export default async function sendOrderStatusEmail(data) {
  try {
    const orderId = Number(data.orderId);
    if (!orderId) return;

    const settings = await getEffectiveEmailNotificationSettings();
    const templateData = await loadOrderTemplateData(orderId, settings, {
      oldStatus: data.before,
      newStatus: data.after
    });
    if (!templateData?.customerEmail) return;

    await sendNotificationEmail({
      notificationType: 'order_status_changed',
      to: templateData.customerEmail,
      data: templateData,
      eventKey: `order:${orderId}:order_status_changed:${data.after}`,
      relatedOrderId: orderId
    });
  } catch (e) {
    error(e);
  }
}
