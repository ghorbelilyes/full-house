import { pool } from '@evershop/evershop/lib/postgres';
import { buildAbsoluteUrl } from '@evershop/evershop/lib/router';
import { getConfig } from '@evershop/evershop/lib/util/getConfig';
import { EmailNotificationSettings } from './constants.js';

type AddressRow = {
  full_name?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  province?: string | null;
  postcode?: string | null;
  country?: string | null;
  telephone?: string | null;
};

function blank(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function formatMoney(value: unknown) {
  const amount = Number(value || 0);
  const currency = getConfig('shop.currency', 'USD');
  const language = getConfig('shop.language', 'fr-TN');
  try {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(value: unknown) {
  if (!value) return '';
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(getConfig('shop.language', 'fr-TN'), {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  }).format(date);
}

export function formatAddress(address?: AddressRow | null) {
  if (!address) return '';
  return [
    address.full_name,
    address.address_1,
    address.address_2,
    [address.postcode, address.city].filter(Boolean).join(' '),
    address.province,
    address.country,
    address.telephone
  ]
    .filter(Boolean)
    .join('\n');
}

function formatProducts(items: Record<string, any>[]) {
  if (!items?.length) return '';
  return items
    .map((item) => {
      const qty = Number(item.qty || 0);
      const price = formatMoney(
        item.line_total_with_discount_incl_tax ||
          item.line_total_with_discount ||
          item.line_total ||
          item.final_price
      );
      return `${item.product_name || item.product_sku} x ${qty} - ${price}`;
    })
    .join('\n');
}

function buildTrackingUrl(carrier: string, trackingNumber: string) {
  if (!carrier || !trackingNumber) return '';
  const carriers = getConfig('oms.carriers', {}) as Record<
    string,
    { name?: string; trackingUrl?: string }
  >;
  const carrierConfig = carriers[carrier];
  if (!carrierConfig?.trackingUrl) {
    return '';
  }
  return carrierConfig.trackingUrl.replace(
    '{trackingNumber}',
    encodeURIComponent(trackingNumber)
  );
}

function getCarrierName(carrier: string) {
  if (!carrier) return '';
  const carriers = getConfig('oms.carriers', {}) as Record<
    string,
    { name?: string }
  >;
  return carriers[carrier]?.name || carrier;
}

function getOrderAdminUrl(order: Record<string, any>) {
  try {
    return buildAbsoluteUrl('orderEdit', { id: order.uuid });
  } catch {
    return '';
  }
}

export function baseTemplateData(settings: EmailNotificationSettings) {
  return {
    storeName: settings.storeName,
    storeUrl: settings.storeUrl
  };
}

export async function loadOrderTemplateData(
  orderId: number,
  settings: EmailNotificationSettings,
  extras: Record<string, any> = {}
) {
  const orderResult = await pool.query('SELECT * FROM "order" WHERE order_id = $1', [
    orderId
  ]);
  const order = orderResult.rows[0];
  if (!order) {
    return null;
  }

  const [itemResult, shippingAddressResult, billingAddressResult, shipmentResult] =
    await Promise.all([
      pool.query(
        'SELECT * FROM order_item WHERE order_item_order_id = $1 ORDER BY order_item_id ASC',
        [order.order_id]
      ),
      order.shipping_address_id
        ? pool.query(
            'SELECT * FROM order_address WHERE order_address_id = $1',
            [order.shipping_address_id]
          )
        : Promise.resolve({ rows: [] }),
      order.billing_address_id
        ? pool.query(
            'SELECT * FROM order_address WHERE order_address_id = $1',
            [order.billing_address_id]
          )
        : Promise.resolve({ rows: [] }),
      pool.query(
        'SELECT * FROM shipment WHERE shipment_order_id = $1 ORDER BY shipment_id DESC LIMIT 1',
        [order.order_id]
      )
    ]);

  const shipment = extras.shipment || shipmentResult.rows[0] || {};
  const trackingNumber =
    extras.trackingNumber || shipment.tracking_number || '';
  const shippingCarrier = extras.shippingCarrier || shipment.carrier || '';
  const trackingUrl =
    extras.trackingUrl || buildTrackingUrl(shippingCarrier, trackingNumber);

  return {
    ...baseTemplateData(settings),
    customerName: blank(order.customer_full_name),
    customerEmail: blank(order.customer_email),
    orderNumber: blank(order.order_number),
    orderDate: formatDate(order.created_at),
    orderTotal: formatMoney(order.grand_total),
    paymentMethod: blank(order.payment_method_name || order.payment_method),
    paymentStatus: blank(extras.paymentStatus || order.payment_status),
    shippingMethod: blank(order.shipping_method_name || order.shipping_method),
    shippingAddress: formatAddress(shippingAddressResult.rows[0]),
    billingAddress: formatAddress(billingAddressResult.rows[0]),
    products: formatProducts(itemResult.rows),
    trackingNumber: blank(trackingNumber),
    trackingUrl: blank(trackingUrl),
    shippingCarrier: blank(getCarrierName(shippingCarrier)),
    orderAdminUrl: getOrderAdminUrl(order),
    resetPasswordUrl: '',
    oldStatus: blank(extras.oldStatus),
    newStatus: blank(extras.newStatus || order.status),
    amount: formatMoney(order.grand_total),
    order,
    shipment
  };
}

export function customerTemplateData(
  customer: Record<string, any> | null,
  settings: EmailNotificationSettings
) {
  return {
    ...baseTemplateData(settings),
    customerName: blank(customer?.full_name || customer?.email || 'Client'),
    customerEmail: blank(customer?.email),
    orderNumber: '',
    orderDate: '',
    orderTotal: '',
    paymentMethod: '',
    paymentStatus: '',
    shippingMethod: '',
    shippingAddress: '',
    billingAddress: '',
    products: '',
    trackingNumber: '',
    trackingUrl: '',
    shippingCarrier: '',
    orderAdminUrl: '',
    resetPasswordUrl: '',
    oldStatus: '',
    newStatus: ''
  };
}

export function resetPasswordTemplateData(
  email: string,
  customer: Record<string, any> | null,
  resetPasswordUrl: string,
  settings: EmailNotificationSettings
) {
  return {
    ...customerTemplateData(customer || { email }, settings),
    customerEmail: email,
    resetPasswordUrl
  };
}
