import {
  NOTIFICATION_TYPES,
  NotificationType
} from '../../services/constants.js';
import { sendNotificationEmail } from '../../services/emailService.js';
import { getEffectiveEmailNotificationSettings } from '../../services/settings.js';

function sampleData(settings, type: NotificationType) {
  return {
    storeName: settings.storeName || 'Protek',
    storeUrl: settings.storeUrl || '',
    customerName: 'Client Test',
    customerEmail: 'client.test@example.com',
    orderNumber: 'TEST-1001',
    orderDate: new Date().toLocaleDateString('fr-TN'),
    orderTotal: '199,00 TND',
    paymentMethod: 'Carte bancaire',
    paymentStatus: type === 'payment_status_changed' ? 'paid' : 'pending',
    shippingMethod: 'Livraison standard',
    shippingAddress: 'Client Test\nRue Exemple\n1000 Tunis\nTunisie',
    billingAddress: 'Client Test\nRue Exemple\n1000 Tunis\nTunisie',
    products: 'Produit test x 1 - 199,00 TND',
    trackingNumber: 'TRACK123456',
    trackingUrl: settings.storeUrl || '',
    shippingCarrier: 'Transporteur',
    orderAdminUrl: settings.storeUrl || '',
    resetPasswordUrl: `${settings.storeUrl || ''}/reset-password?token=test`,
    oldStatus: 'pending',
    newStatus: type === 'order_status_changed' ? 'processing' : 'pending'
  };
}

export default async function sendTest(request, response) {
  try {
    const body = request.body || {};
    const type = body.notificationType || body.type || 'order_placed_customer';
    if (!NOTIFICATION_TYPES.includes(type)) {
      response.status(400).json({
        error: {
          message: 'Type de notification invalide.'
        }
      });
      return;
    }

    const settings = await getEffectiveEmailNotificationSettings();
    const recipient =
      body.recipient ||
      settings.testEmailRecipient ||
      settings.adminEmail ||
      settings.senderEmail;

    await sendNotificationEmail({
      notificationType: type,
      to: recipient,
      data: sampleData(settings, type),
      eventKey: `test:${type}:${Date.now()}`,
      force: true,
      throwOnError: true
    });

    response.json({
      data: {
        message: 'Email de test envoyé.'
      }
    });
  } catch (e) {
    response.status(400).json({
      error: {
        message: e.message
      }
    });
  }
}
