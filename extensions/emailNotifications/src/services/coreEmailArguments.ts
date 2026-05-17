import { NotificationType } from './constants.js';
import {
  customerTemplateData,
  loadOrderTemplateData,
  resetPasswordTemplateData
} from './data.js';
import { getEffectiveEmailNotificationSettings } from './settings.js';
import { getEmailTemplate } from './templates.js';
import { renderEmailTemplate } from './templateRenderer.js';

type SendEmailArguments = {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  body?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
};

function getCustomerId(customer: Record<string, any> | null) {
  return customer?.customer_id ? Number(customer.customer_id) : null;
}

export async function prepareCoreEmailArguments(
  notificationType: NotificationType,
  args: SendEmailArguments,
  context: Record<string, any> = {}
) {
  const settings = await getEffectiveEmailNotificationSettings();
  const event = settings.events[notificationType];
  const template = await getEmailTemplate(event.templateKey);
  let data: Record<string, any> | null = null;
  let eventKey = '';
  let relatedOrderId: number | null = null;
  let relatedCustomerId: number | null = null;

  if (notificationType === 'order_placed_customer') {
    const order = context.order || args.data?.order;
    relatedOrderId = order?.order_id ? Number(order.order_id) : null;
    if (relatedOrderId) {
      data = await loadOrderTemplateData(relatedOrderId, settings);
      eventKey = `order:${relatedOrderId}:order_placed_customer`;
    }
  }

  if (notificationType === 'customer_registered') {
    const customer = context.customer || args.data?.customer || args.data;
    relatedCustomerId = getCustomerId(customer);
    data = customerTemplateData(customer, settings);
    eventKey = `customer:${relatedCustomerId || args.to}:customer_registered`;
  }

  if (notificationType === 'reset_password') {
    const customer = context.customer || args.data?.customer || null;
    relatedCustomerId = getCustomerId(customer);
    const resetPasswordUrl = String(args.data?.resetPasswordUrl || '');
    const token = String(args.data?.token || Date.now());
    data = resetPasswordTemplateData(args.to, customer, resetPasswordUrl, settings);
    eventKey = `reset_password:${args.to}:${token}`;
  }

  if (!data) {
    data = {
      storeName: settings.storeName,
      storeUrl: settings.storeUrl
    };
  }

  const rendered = renderEmailTemplate({
    subjectTemplate: event.subject,
    htmlTemplate: template.htmlTemplate,
    textTemplate: template.textTemplate,
    data
  });

  return {
    ...args,
    subject: rendered.subject,
    template: template.htmlTemplate,
    body: rendered.html,
    text: rendered.text,
    data,
    metadata: {
      ...(typeof args.metadata === 'object' ? args.metadata : {}),
      notificationType,
      eventKey,
      relatedOrderId,
      relatedCustomerId
    }
  };
}
