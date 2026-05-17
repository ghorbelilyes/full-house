import { error } from '@evershop/evershop/lib/log';
import { getEffectiveEmailNotificationSettings } from '../../services/settings.js';
import { loadOrderTemplateData } from '../../services/data.js';
import { sendNotificationEmail } from '../../services/emailService.js';

export default async function sendAdminNewOrderEmail(data) {
  try {
    const orderId = Number(data.order_id);
    if (!orderId) return;

    const settings = await getEffectiveEmailNotificationSettings();
    const templateData = await loadOrderTemplateData(orderId, settings);
    if (!templateData || !settings.adminEmail) return;

    await sendNotificationEmail({
      notificationType: 'order_placed_admin',
      to: settings.adminEmail,
      data: templateData,
      eventKey: `order:${orderId}:order_placed_admin`,
      relatedOrderId: orderId
    });
  } catch (e) {
    error(e);
  }
}
