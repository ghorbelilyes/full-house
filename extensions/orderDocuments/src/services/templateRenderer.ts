import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { select } from '@evershop/postgres-query-builder';
import { pool } from '@evershop/evershop/lib/postgres';
import { OrderData } from './orderDataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve templates relative to the dist/services directory
const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');

/**
 * Format a number as currency (TND)
 */
function formatCurrency(amount: number | string, currency: string = 'TND'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0,000 DT';
  const formatted = num.toFixed(3).replace('.', ',');
  const parts = formatted.split(',');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',') + '\u00a0DT';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-TN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-TN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function translatePaymentStatus(status: string | null): string {
  const map: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payé',
    refunded: 'Remboursé',
    partially_refunded: 'Partiellement remboursé'
  };
  return status ? (map[status] || status) : '—';
}

function translateShipmentStatus(status: string | null): string {
  const map: Record<string, string> = {
    processing: 'En traitement',
    shipped: 'Expédié',
    delivered: 'Livré',
    cancelled: 'Annulé'
  };
  return status ? (map[status] || status) : '—';
}

function formatAddress(addr: any): string {
  if (!addr) return '<em>Non renseignée</em>';
  const lines: string[] = [];
  if (addr.full_name) lines.push(`<strong>${escapeHtml(addr.full_name)}</strong>`);
  if (addr.address_1) lines.push(escapeHtml(addr.address_1));
  if (addr.address_2) lines.push(escapeHtml(addr.address_2));
  const cityLine: string[] = [];
  if (addr.postcode) cityLine.push(escapeHtml(addr.postcode));
  if (addr.city) cityLine.push(escapeHtml(addr.city));
  if (cityLine.length) lines.push(cityLine.join(' '));
  if (addr.province) lines.push(escapeHtml(addr.province));
  if (addr.telephone) lines.push(`Tél : ${escapeHtml(addr.telephone)}`);
  return lines.join('<br>');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildItemsRows(items: any[], includePrice: boolean = true): string {
  return items.map((item, i) => {
    let variantInfo = '';
    if (item.variant_options) {
      try {
        const opts = JSON.parse(item.variant_options);
        if (Array.isArray(opts)) {
          variantInfo = opts.map((o: any) =>
            `<span class="variant-tag">${escapeHtml(o.attribute_name || o.attributeName || '')}: ${escapeHtml(o.option_text || o.optionText || '')}</span>`
          ).join(' ');
        }
      } catch { /* ignore */ }
    }
    const nameCell = `
      <td class="item-name">
        ${escapeHtml(item.product_name || '')}
        ${variantInfo ? `<div class="variant-options">${variantInfo}</div>` : ''}
        <div class="item-sku">Réf : ${escapeHtml(item.product_sku || '')}</div>
      </td>
    `;

    if (includePrice) {
      return `
        <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
          <td class="col-num">${i + 1}</td>
          ${nameCell}
          <td class="col-qty">${item.qty}</td>
          <td class="col-price">${formatCurrency(item.final_price_incl_tax)}</td>
          <td class="col-total">${formatCurrency(item.line_total_with_discount_incl_tax)}</td>
        </tr>
      `;
    } else {
      return `
        <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
          <td class="col-num">${i + 1}</td>
          ${nameCell}
          <td class="col-qty">${item.qty}</td>
        </tr>
      `;
    }
  }).join('');
}

export type DocumentType = 'facture' | 'bon_commande' | 'bon_livraison';

interface TemplateData {
  documentType: DocumentType;
  documentTitle: string;
  documentNumber: string;
  documentDate: string;
  documentDateShort: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo: string;
  companyTaxId: string;
  companyRc: string;
  orderNumber: string;
  orderDate: string;
  orderDateShort: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingMethod: string;
  shipmentStatus: string;
  shippingNote: string;
  customerName: string;
  customerEmail: string;
  shippingAddressHtml: string;
  billingAddressHtml: string;
  itemsRowsHtml: string;
  itemCount: number;
  totalQty: number;
  subTotal: string;
  discount: string;
  hasDiscount: boolean;
  shippingFee: string;
  taxAmount: string;
  grandTotal: string;
  discountRaw: number;
  shippingFeeRaw: number;
  taxRaw: number;
}

function getDocumentTitle(type: DocumentType): string {
  switch (type) {
    case 'facture': return 'Facture';
    case 'bon_commande': return 'Bon de Commande';
    case 'bon_livraison': return 'Bon de Livraison';
  }
}

function getDocumentPrefix(type: DocumentType): string {
  switch (type) {
    case 'facture': return 'FAC';
    case 'bon_commande': return 'BC';
    case 'bon_livraison': return 'BL';
  }
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  taxId: string;
  rc: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: 'Protek',
  address: 'Tunisie',
  phone: '',
  email: '',
  logo: '/logo.png',
  taxId: '',
  rc: ''
};

/** All available template variables for the editor reference */
export const TEMPLATE_VARIABLES = [
  { key: 'documentType', label: 'Type du document (facture, bon_commande, bon_livraison)' },
  { key: 'documentTitle', label: 'Titre du document (Facture, Bon de Commande, ...)' },
  { key: 'documentNumber', label: 'Numéro du document (FAC-10042)' },
  { key: 'documentDate', label: 'Date du document (format long)' },
  { key: 'documentDateShort', label: 'Date du document (format court)' },
  { key: 'companyName', label: 'Nom de l\'entreprise' },
  { key: 'companyAddress', label: 'Adresse de l\'entreprise' },
  { key: 'companyPhone', label: 'Téléphone de l\'entreprise' },
  { key: 'companyEmail', label: 'Email de l\'entreprise' },
  { key: 'companyTaxId', label: 'Matricule fiscal (MF)' },
  { key: 'companyRc', label: 'Registre de commerce (RC)' },
  { key: 'orderNumber', label: 'Numéro de commande' },
  { key: 'orderDate', label: 'Date de commande (format long)' },
  { key: 'orderDateShort', label: 'Date de commande (format court)' },
  { key: 'currency', label: 'Devise' },
  { key: 'paymentMethod', label: 'Mode de paiement' },
  { key: 'paymentStatus', label: 'Statut du paiement' },
  { key: 'shippingMethod', label: 'Mode de livraison' },
  { key: 'shipmentStatus', label: 'Statut de la livraison' },
  { key: 'shippingNote', label: 'Notes de livraison' },
  { key: 'customerName', label: 'Nom du client' },
  { key: 'customerEmail', label: 'Email du client' },
  { key: 'shippingAddressHtml', label: 'Adresse de livraison (HTML)' },
  { key: 'billingAddressHtml', label: 'Adresse de facturation (HTML)' },
  { key: 'itemsRowsHtml', label: 'Lignes du tableau des articles (HTML)' },
  { key: 'itemCount', label: 'Nombre de lignes' },
  { key: 'totalQty', label: 'Quantité totale' },
  { key: 'subTotal', label: 'Sous-total' },
  { key: 'discount', label: 'Montant de la remise' },
  { key: 'hasDiscount', label: 'A une remise (conditionnel)' },
  { key: 'shippingFee', label: 'Frais de livraison' },
  { key: 'taxAmount', label: 'Montant TVA' },
  { key: 'grandTotal', label: 'Total TTC' }
];

/**
 * Build the template data object from order + company info
 */
function buildTemplateData(
  order: OrderData,
  type: DocumentType,
  company?: Partial<CompanyInfo>
): TemplateData {
  const co = { ...DEFAULT_COMPANY, ...company };
  const includePrice = type !== 'bon_livraison';

  return {
    documentType: type,
    documentTitle: getDocumentTitle(type),
    documentNumber: `${getDocumentPrefix(type)}-${order.order_number}`,
    documentDate: formatDate(order.created_at),
    documentDateShort: formatDateShort(order.created_at),
    companyName: co.name,
    companyAddress: co.address,
    companyPhone: co.phone,
    companyEmail: co.email,
    companyLogo: co.logo,
    companyTaxId: co.taxId,
    companyRc: co.rc,
    orderNumber: order.order_number,
    orderDate: formatDate(order.created_at),
    orderDateShort: formatDateShort(order.created_at),
    currency: order.currency || 'TND',
    paymentMethod: order.payment_method_name || '—',
    paymentStatus: translatePaymentStatus(order.payment_status),
    shippingMethod: order.shipping_method_name || '—',
    shipmentStatus: translateShipmentStatus(order.shipment_status),
    shippingNote: order.shipping_note || '',
    customerName: order.customer_full_name || '—',
    customerEmail: order.customer_email || '',
    shippingAddressHtml: formatAddress(order.shippingAddress),
    billingAddressHtml: formatAddress(order.billingAddress),
    itemsRowsHtml: buildItemsRows(order.items, includePrice),
    itemCount: order.items.length,
    totalQty: order.total_qty,
    subTotal: formatCurrency(order.sub_total_incl_tax),
    discount: formatCurrency(order.discount_amount),
    hasDiscount: parseFloat(String(order.discount_amount)) > 0,
    shippingFee: formatCurrency(order.shipping_fee_incl_tax),
    taxAmount: formatCurrency(order.total_tax_amount),
    grandTotal: formatCurrency(order.grand_total),
    discountRaw: parseFloat(String(order.discount_amount)) || 0,
    shippingFeeRaw: parseFloat(String(order.shipping_fee_incl_tax)) || 0,
    taxRaw: parseFloat(String(order.total_tax_amount)) || 0
  };
}

/**
 * Apply placeholder substitution to a template string
 */
function applyTemplate(template: string, data: TemplateData): string {
  let html = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, String(value));
  }

  // {{#if key}}...{{/if}}
  html = html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    const val = (data as any)[key];
    if (val && val !== '—' && val !== '' && val !== '0' && val !== false) {
      return content;
    }
    return '';
  });

  // {{#unless key}}...{{/unless}}
  html = html.replace(/\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, key, content) => {
    const val = (data as any)[key];
    if (!val || val === '—' || val === '' || val === '0' || val === false) {
      return content;
    }
    return '';
  });

  return html;
}

/**
 * Load the default file-based template for a type
 */
function loadFileTemplate(type: DocumentType): string {
  const templateFile = path.join(TEMPLATES_DIR, `${type}.html`);
  if (fs.existsSync(templateFile)) {
    return fs.readFileSync(templateFile, 'utf-8');
  }
  return fs.readFileSync(path.join(TEMPLATES_DIR, 'default.html'), 'utf-8');
}

/**
 * Try to load the default template from the database for a given type.
 * Falls back to the file-based template if none is found.
 */
async function loadTemplate(type: DocumentType): Promise<string> {
  try {
    const dbTemplate = await select()
      .from('document_template')
      .where('type', '=', type)
      .and('is_default', '=', true)
      .load(pool);

    if (dbTemplate && dbTemplate.content) {
      return dbTemplate.content as string;
    }
  } catch {
    // DB not ready or table doesn't exist yet — fall back to file
  }

  return loadFileTemplate(type);
}

/**
 * Render an order document to HTML.
 * Checks DB for a default template first, then falls back to file.
 */
export async function renderDocument(
  order: OrderData,
  type: DocumentType,
  company?: Partial<CompanyInfo>
): Promise<string> {
  const data = buildTemplateData(order, type, company);
  const template = await loadTemplate(type);
  return applyTemplate(template, data);
}

/**
 * Render an order document from a raw HTML template string.
 * Used for preview in the template editor.
 */
export function renderDocumentFromString(
  order: OrderData,
  type: DocumentType,
  templateString: string,
  company?: Partial<CompanyInfo>
): string {
  const data = buildTemplateData(order, type, company);
  return applyTemplate(templateString, data);
}
