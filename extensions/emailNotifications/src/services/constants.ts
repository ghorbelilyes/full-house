import { getBrandStoreNameFallback } from '@evershop/evershop/lib/branding/getBrandConfig.js';

export type EmailProviderCode = 'sendgrid' | 'smtp';

export const SETTINGS_KEY = 'emailNotificationsSettings';
export const SECRETS_KEY = 'emailNotificationsSecrets';

export const NOTIFICATION_TYPES = [
  'order_placed_customer',
  'order_placed_admin',
  'customer_registered',
  'reset_password',
  'order_status_changed',
  'payment_status_changed',
  'shipment_created',
  'tracking_number_added'
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_DEFINITIONS: Record<
  NotificationType,
  {
    label: string;
    description: string;
    recipient: string;
    templateKey: NotificationType;
  }
> = {
  order_placed_customer: {
    label: 'Confirmation de commande client',
    description: 'Envoyé au client après la validation de la commande.',
    recipient: 'Client',
    templateKey: 'order_placed_customer'
  },
  order_placed_admin: {
    label: 'Nouvelle commande administrateur',
    description: "Envoyé à l'adresse administrateur quand une commande arrive.",
    recipient: 'Administrateur',
    templateKey: 'order_placed_admin'
  },
  customer_registered: {
    label: 'Bienvenue nouveau client',
    description: "Envoyé au client après la création d'un compte.",
    recipient: 'Client',
    templateKey: 'customer_registered'
  },
  reset_password: {
    label: 'Réinitialisation du mot de passe',
    description: 'Envoyé au client avec son lien sécurisé.',
    recipient: 'Client',
    templateKey: 'reset_password'
  },
  order_status_changed: {
    label: 'Statut de commande modifié',
    description: 'Envoyé au client pour les statuts de commande sélectionnés.',
    recipient: 'Client',
    templateKey: 'order_status_changed'
  },
  payment_status_changed: {
    label: 'Statut de paiement modifié',
    description: 'Envoyé au client pour les statuts de paiement sélectionnés.',
    recipient: 'Client',
    templateKey: 'payment_status_changed'
  },
  shipment_created: {
    label: 'Expédition créée',
    description: "Envoyé au client lorsqu'une expédition est créée.",
    recipient: 'Client',
    templateKey: 'shipment_created'
  },
  tracking_number_added: {
    label: 'Numéro de suivi ajouté',
    description: 'Envoyé au client lorsque le suivi est ajouté ou mis à jour.',
    recipient: 'Client',
    templateKey: 'tracking_number_added'
  }
};

export type EventSetting = {
  enabled: boolean;
  subject: string;
  recipientType: 'customer' | 'admin' | 'custom';
  templateKey: NotificationType;
  statuses?: string[];
  paymentStatuses?: string[];
};

export type EmailNotificationSettings = {
  enabled: boolean;
  activeProvider: EmailProviderCode;
  senderEmail: string;
  senderName: string;
  replyToEmail: string;
  adminEmail: string;
  storeName: string;
  storeUrl: string;
  testEmailRecipient: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    fromEmail: string;
    fromName: string;
    replyToEmail: string;
  };
  sendgrid: {
    fromEmail: string;
    fromName: string;
    replyToEmail: string;
  };
  events: Record<NotificationType, EventSetting>;
};

export type EmailNotificationSecrets = {
  smtpPassword?: string;
  sendgridApiKey?: string;
};

export const DEFAULT_EVENT_SETTINGS: Record<NotificationType, EventSetting> = {
  order_placed_customer: {
    enabled: true,
    recipientType: 'customer',
    subject: 'Confirmation de commande - {{orderNumber}}',
    templateKey: 'order_placed_customer'
  },
  order_placed_admin: {
    enabled: true,
    recipientType: 'admin',
    subject: 'Nouvelle commande reçue - {{orderNumber}}',
    templateKey: 'order_placed_admin'
  },
  customer_registered: {
    enabled: true,
    recipientType: 'customer',
    subject: 'Bienvenue chez {{storeName}}',
    templateKey: 'customer_registered'
  },
  reset_password: {
    enabled: true,
    recipientType: 'customer',
    subject: 'Réinitialiser votre mot de passe',
    templateKey: 'reset_password'
  },
  order_status_changed: {
    enabled: true,
    recipientType: 'customer',
    subject: 'Votre commande {{orderNumber}} a été mise à jour',
    templateKey: 'order_status_changed',
    statuses: [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'canceled',
      'cancelled',
      'refunded',
      'completed',
      'closed'
    ]
  },
  payment_status_changed: {
    enabled: true,
    recipientType: 'customer',
    subject: 'Mise à jour du paiement pour la commande {{orderNumber}}',
    templateKey: 'payment_status_changed',
    paymentStatuses: [
      'paid',
      'pending',
      'canceled',
      'cancelled',
      'refunded',
      'paypal_captured',
      'stripe_captured',
      'stripe_refunded',
      'stripe_partial_refunded'
    ]
  },
  shipment_created: {
    enabled: true,
    recipientType: 'customer',
    subject: 'Votre commande {{orderNumber}} a été expédiée',
    templateKey: 'shipment_created'
  },
  tracking_number_added: {
    enabled: true,
    recipientType: 'customer',
    subject: 'Informations de suivi pour la commande {{orderNumber}}',
    templateKey: 'tracking_number_added'
  }
};

export const DEFAULT_SETTINGS: EmailNotificationSettings = {
  enabled: false,
  activeProvider: 'sendgrid',
  senderEmail: '',
  senderName: getBrandStoreNameFallback(),
  replyToEmail: '',
  adminEmail: '',
  storeName: getBrandStoreNameFallback(),
  storeUrl: '',
  testEmailRecipient: '',
  smtp: {
    host: '',
    port: 587,
    secure: false,
    username: '',
    fromEmail: '',
    fromName: getBrandStoreNameFallback(),
    replyToEmail: ''
  },
  sendgrid: {
    fromEmail: '',
    fromName: getBrandStoreNameFallback(),
    replyToEmail: ''
  },
  events: DEFAULT_EVENT_SETTINGS
};

const baseHtml = (content: string) => `<!doctype html>
<html>
  <body style="margin:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f9;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #e5e7eb;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;color:#111827;">{{storeName}}</h1>
                <p style="margin:6px 0 0;font-size:14px;color:#6b7280;">{{storeUrl}}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">
                Merci, {{storeName}}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const DEFAULT_TEMPLATES: Record<
  NotificationType,
  {
    name: string;
    description: string;
    html: string;
    text: string;
  }
> = {
  order_placed_customer: {
    name: 'Confirmation de commande client',
    description: 'Modèle envoyé au client après commande.',
    html: baseHtml(`
      <p style="margin:0 0 16px;font-size:16px;">Bonjour {{customerName}},</p>
      <p style="margin:0 0 18px;">Votre commande <strong>{{orderNumber}}</strong> a bien été enregistrée le {{orderDate}}.</p>
      <h2 style="font-size:16px;margin:24px 0 8px;">Produits</h2>
      <pre style="white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px;font-family:Arial,Helvetica,sans-serif;">{{products}}</pre>
      <p style="margin:16px 0;"><strong>Total :</strong> {{orderTotal}}</p>
      <p style="margin:16px 0;"><strong>Adresse de livraison :</strong><br>{{shippingAddress}}</p>
      <p style="margin:16px 0;"><strong>Adresse de facturation :</strong><br>{{billingAddress}}</p>
      <p style="margin:24px 0 0;"><a href="{{storeUrl}}" style="color:#0f766e;">Voir la boutique</a></p>
    `),
    text: `Bonjour {{customerName}},

Votre commande {{orderNumber}} a bien été enregistrée le {{orderDate}}.

Produits:
{{products}}

Total: {{orderTotal}}
Adresse de livraison:
{{shippingAddress}}

Adresse de facturation:
{{billingAddress}}

{{storeName}} - {{storeUrl}}`
  },
  order_placed_admin: {
    name: 'Nouvelle commande administrateur',
    description: "Modèle envoyé à l'administrateur après commande.",
    html: baseHtml(`
      <p style="margin:0 0 18px;">Une nouvelle commande a été reçue.</p>
      <p><strong>Commande :</strong> {{orderNumber}}</p>
      <p><strong>Client :</strong> {{customerName}} - {{customerEmail}}</p>
      <p><strong>Total :</strong> {{orderTotal}}</p>
      <p><strong>Paiement :</strong> {{paymentMethod}} - {{paymentStatus}}</p>
      <p><strong>Livraison :</strong> {{shippingMethod}}</p>
      <p><strong>Adresse de livraison :</strong><br>{{shippingAddress}}</p>
      <p style="margin:24px 0 0;"><a href="{{orderAdminUrl}}" style="color:#0f766e;">Ouvrir la commande</a></p>
    `),
    text: `Nouvelle commande reçue.

Commande: {{orderNumber}}
Client: {{customerName}} - {{customerEmail}}
Total: {{orderTotal}}
Paiement: {{paymentMethod}} - {{paymentStatus}}
Livraison: {{shippingMethod}}
Adresse de livraison:
{{shippingAddress}}

Commande admin: {{orderAdminUrl}}`
  },
  customer_registered: {
    name: 'Bienvenue nouveau client',
    description: 'Modèle envoyé après inscription client.',
    html: baseHtml(`
      <p style="margin:0 0 16px;font-size:16px;">Bonjour {{customerName}},</p>
      <p style="margin:0 0 18px;">Bienvenue chez {{storeName}}. Votre compte client est prêt.</p>
      <p style="margin:24px 0 0;"><a href="{{storeUrl}}" style="color:#0f766e;">Accéder à la boutique</a></p>
    `),
    text: `Bonjour {{customerName}},

Bienvenue chez {{storeName}}. Votre compte client est prêt.

{{storeUrl}}`
  },
  reset_password: {
    name: 'Réinitialisation du mot de passe',
    description: 'Modèle envoyé avec le lien de réinitialisation sécurisé.',
    html: baseHtml(`
      <p style="margin:0 0 16px;font-size:16px;">Bonjour {{customerName}},</p>
      <p style="margin:0 0 18px;">Une demande de réinitialisation du mot de passe a été reçue pour votre compte {{storeName}}.</p>
      <p style="margin:24px 0;"><a href="{{resetPasswordUrl}}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;padding:12px 18px;">Réinitialiser le mot de passe</a></p>
      <p style="margin:0;color:#6b7280;font-size:14px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message. Le lien expire automatiquement si une durée d'expiration est configurée.</p>
    `),
    text: `Bonjour {{customerName}},

Une demande de réinitialisation du mot de passe a été reçue pour votre compte {{storeName}}.

Lien sécurisé:
{{resetPasswordUrl}}

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.`
  },
  order_status_changed: {
    name: 'Statut de commande modifié',
    description: 'Modèle envoyé lors du changement de statut de commande.',
    html: baseHtml(`
      <p style="margin:0 0 16px;font-size:16px;">Bonjour {{customerName}},</p>
      <p>Le statut de votre commande <strong>{{orderNumber}}</strong> a été mis à jour.</p>
      <p><strong>Ancien statut :</strong> {{oldStatus}}</p>
      <p><strong>Nouveau statut :</strong> {{newStatus}}</p>
      <p><strong>Suivi :</strong> {{trackingNumber}}</p>
      <p style="margin:24px 0 0;"><a href="{{trackingUrl}}" style="color:#0f766e;">Voir le suivi</a></p>
    `),
    text: `Bonjour {{customerName}},

Le statut de votre commande {{orderNumber}} a été mis à jour.

Ancien statut: {{oldStatus}}
Nouveau statut: {{newStatus}}
Suivi: {{trackingNumber}}
Lien de suivi: {{trackingUrl}}

{{storeName}} - {{storeUrl}}`
  },
  payment_status_changed: {
    name: 'Statut de paiement modifié',
    description: 'Modèle envoyé lors du changement de statut de paiement.',
    html: baseHtml(`
      <p style="margin:0 0 16px;font-size:16px;">Bonjour {{customerName}},</p>
      <p>Le paiement de votre commande <strong>{{orderNumber}}</strong> a été mis à jour.</p>
      <p><strong>Statut :</strong> {{paymentStatus}}</p>
      <p><strong>Montant :</strong> {{orderTotal}}</p>
      <p><strong>Méthode :</strong> {{paymentMethod}}</p>
    `),
    text: `Bonjour {{customerName}},

Le paiement de votre commande {{orderNumber}} a été mis à jour.

Statut: {{paymentStatus}}
Montant: {{orderTotal}}
Méthode: {{paymentMethod}}

{{storeName}}`
  },
  shipment_created: {
    name: 'Expédition créée',
    description: "Modèle envoyé lorsqu'une expédition est créée.",
    html: baseHtml(`
      <p style="margin:0 0 16px;font-size:16px;">Bonjour {{customerName}},</p>
      <p>Votre commande <strong>{{orderNumber}}</strong> a été expédiée.</p>
      <p><strong>Transporteur :</strong> {{shippingCarrier}}</p>
      <p><strong>Numéro de suivi :</strong> {{trackingNumber}}</p>
      <p style="margin:24px 0 0;"><a href="{{trackingUrl}}" style="color:#0f766e;">Voir le suivi</a></p>
    `),
    text: `Bonjour {{customerName}},

Votre commande {{orderNumber}} a été expédiée.

Transporteur: {{shippingCarrier}}
Numéro de suivi: {{trackingNumber}}
Lien de suivi: {{trackingUrl}}

{{storeName}}`
  },
  tracking_number_added: {
    name: 'Numéro de suivi ajouté',
    description: 'Modèle envoyé lorsque les informations de suivi changent.',
    html: baseHtml(`
      <p style="margin:0 0 16px;font-size:16px;">Bonjour {{customerName}},</p>
      <p>Les informations de suivi de votre commande <strong>{{orderNumber}}</strong> ont été mises à jour.</p>
      <p><strong>Transporteur :</strong> {{shippingCarrier}}</p>
      <p><strong>Numéro de suivi :</strong> {{trackingNumber}}</p>
      <p style="margin:24px 0 0;"><a href="{{trackingUrl}}" style="color:#0f766e;">Voir le suivi</a></p>
    `),
    text: `Bonjour {{customerName}},

Les informations de suivi de votre commande {{orderNumber}} ont été mises à jour.

Transporteur: {{shippingCarrier}}
Numéro de suivi: {{trackingNumber}}
Lien de suivi: {{trackingUrl}}

{{storeName}}`
  }
};
