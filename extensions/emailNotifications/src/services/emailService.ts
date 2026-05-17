import { error, info } from '@evershop/evershop/lib/log';
import {
  EmailNotificationSettings,
  NotificationType
} from './constants.js';
import {
  markEmailLogFailure,
  markEmailLogSuccess,
  reserveEmailLog
} from './logs.js';
import { sendWithProvider } from './provider.js';
import {
  getEffectiveEmailNotificationSettings
} from './settings.js';
import { getEmailTemplate } from './templates.js';
import { renderEmailTemplate, TemplateVariables } from './templateRenderer.js';

type SendEmailArguments = {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  body?: string;
  text?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
};

type SendNotificationOptions = {
  to: string;
  notificationType: NotificationType;
  data: TemplateVariables;
  subject?: string;
  eventKey?: string;
  relatedOrderId?: number | null;
  relatedCustomerId?: number | null;
  force?: boolean;
  throwOnError?: boolean;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function shouldSendEvent(
  settings: EmailNotificationSettings,
  type: NotificationType,
  data: TemplateVariables,
  force = false
) {
  if (force) return true;
  if (!settings.enabled) return false;
  const event = settings.events[type];
  if (!event?.enabled) return false;

  if (type === 'order_status_changed' && event.statuses?.length) {
    return event.statuses.includes(String(data.newStatus || ''));
  }

  if (type === 'payment_status_changed' && event.paymentStatuses?.length) {
    return event.paymentStatuses.includes(String(data.paymentStatus || ''));
  }

  return true;
}

async function deliverRenderedEmail({
  settings,
  notificationType,
  to,
  subject,
  html,
  text,
  eventKey,
  relatedOrderId,
  relatedCustomerId,
  metadata,
  throwOnError = false
}: {
  settings: EmailNotificationSettings;
  notificationType: NotificationType | string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  eventKey?: string;
  relatedOrderId?: number | null;
  relatedCustomerId?: number | null;
  metadata?: Record<string, any>;
  throwOnError?: boolean;
}) {
  if (!to || !isEmail(to)) {
    const e = new Error('Destinataire email invalide.');
    if (throwOnError) throw e;
    error(e);
    return false;
  }

  const reservation = await reserveEmailLog({
    notificationType,
    eventKey,
    recipient: to,
    provider: settings.activeProvider,
    relatedOrderId,
    relatedCustomerId,
    metadata
  });

  if (!reservation.shouldSend) {
    return false;
  }

  try {
    await sendWithProvider(settings.activeProvider, settings, {
      to,
      subject,
      html,
      text,
      metadata: {
        notificationType,
        eventKey: eventKey || ''
      }
    });
    await markEmailLogSuccess(reservation.logId);
    info(`Email notification sent: ${notificationType} -> ${to}`);
    return true;
  } catch (e) {
    await markEmailLogFailure(reservation.logId, e);
    error(e);
    if (throwOnError) {
      throw e;
    }
    return false;
  }
}

export async function sendNotificationEmail(options: SendNotificationOptions) {
  const settings = await getEffectiveEmailNotificationSettings();
  const event = settings.events[options.notificationType];
  if (!shouldSendEvent(settings, options.notificationType, options.data, options.force)) {
    return false;
  }

  const template = await getEmailTemplate(event.templateKey);
  const rendered = renderEmailTemplate({
    subjectTemplate: options.subject || event.subject,
    htmlTemplate: template.htmlTemplate,
    textTemplate: template.textTemplate,
    data: options.data
  });

  return await deliverRenderedEmail({
    settings,
    notificationType: options.notificationType,
    to: options.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    eventKey: options.eventKey,
    relatedOrderId: options.relatedOrderId,
    relatedCustomerId: options.relatedCustomerId,
    metadata: {
      notificationType: options.notificationType
    },
    throwOnError: options.throwOnError
  });
}

export async function sendPreparedEmailArguments(args: SendEmailArguments) {
  const metadata = (args.metadata || {}) as Record<string, any>;
  if (metadata.skipEmail === true) {
    return;
  }

  const settings = await getEffectiveEmailNotificationSettings();
  const type = metadata.notificationType as NotificationType | undefined;
  if (type && !shouldSendEvent(settings, type, args.data || {}, false)) {
    return;
  }

  await deliverRenderedEmail({
    settings,
    notificationType: type || 'custom',
    to: args.to,
    subject: args.subject,
    html: args.body || args.template,
    text: typeof args.text === 'string' ? args.text : undefined,
    eventKey: typeof metadata.eventKey === 'string' ? metadata.eventKey : undefined,
    relatedOrderId:
      typeof metadata.relatedOrderId === 'number'
        ? metadata.relatedOrderId
        : null,
    relatedCustomerId:
      typeof metadata.relatedCustomerId === 'number'
        ? metadata.relatedCustomerId
        : null,
    metadata,
    throwOnError: metadata.throwOnError === true
  });
}
