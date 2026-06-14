import { renderDocumentFromString, DocumentType } from '../../services/templateRenderer.js';
import { OrderData } from '../../services/orderDataLoader.js';
import { getBrandStoreNameFallback } from '@evershop/evershop/lib/branding/getBrandConfig.js';
import config from 'config';
import type { CompanyInfo } from '../../services/templateRenderer.js';

function getSampleOrder(): OrderData {
  return {
    order_id: 0,
    uuid: '00000000-0000-0000-0000-000000000000',
    order_number: '10042',
    status: 'processing',
    currency: 'TND',
    customer_email: 'client@exemple.tn',
    customer_full_name: 'Ahmed Ben Ali',
    coupon: null,
    shipping_fee_excl_tax: 7,
    shipping_fee_incl_tax: 8.33,
    discount_amount: 15,
    sub_total: 250,
    sub_total_incl_tax: 297.5,
    sub_total_with_discount: 235,
    sub_total_with_discount_incl_tax: 279.65,
    total_qty: 3,
    tax_amount: 47.5,
    total_tax_amount: 49.16,
    grand_total: 272.98,
    shipping_method_name: 'Livraison standard',
    payment_method_name: 'Paiement à la livraison',
    shipment_status: 'processing',
    payment_status: 'pending',
    shipping_note: 'Merci de livrer entre 9h et 12h.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        order_item_id: 1,
        product_sku: 'CAM-001',
        product_name: 'Caméra de Surveillance Extérieure 4K',
        qty: 1,
        product_price: 150,
        product_price_incl_tax: 178.5,
        final_price: 150,
        final_price_incl_tax: 178.5,
        tax_percent: 19,
        tax_amount: 28.5,
        discount_amount: 10,
        line_total: 150,
        line_total_incl_tax: 178.5,
        line_total_with_discount: 140,
        line_total_with_discount_incl_tax: 166.6,
        variant_options: JSON.stringify([
          { attribute_name: 'Couleur', option_text: 'Blanc' }
        ])
      },
      {
        order_item_id: 2,
        product_sku: 'ALM-002',
        product_name: 'Détecteur de Mouvement Sans Fil',
        qty: 2,
        product_price: 50,
        product_price_incl_tax: 59.5,
        final_price: 50,
        final_price_incl_tax: 59.5,
        tax_percent: 19,
        tax_amount: 19,
        discount_amount: 5,
        line_total: 100,
        line_total_incl_tax: 119,
        line_total_with_discount: 95,
        line_total_with_discount_incl_tax: 113.05,
        variant_options: null
      }
    ],
    shippingAddress: {
      order_address_id: 1,
      full_name: 'Ahmed Ben Ali',
      telephone: '+216 50 123 456',
      address_1: '15 Rue de la République',
      address_2: '',
      city: 'Tunis',
      province: 'Tunis',
      postcode: '1000',
      country: 'TN'
    },
    billingAddress: {
      order_address_id: 2,
      full_name: 'Ahmed Ben Ali',
      telephone: '+216 50 123 456',
      address_1: '15 Rue de la République',
      address_2: '',
      city: 'Tunis',
      province: 'Tunis',
      postcode: '1000',
      country: 'TN'
    }
  };
}

/**
 * Reverse the HTML-escape applied globally by EverShop's escapePayload middleware.
 * It only escapes < and > inside HTML tags, so we just revert &lt; and &gt;.
 */
function unescapeHtml(str: string): string {
  return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
}

export default async function previewTemplateHandler(request: any, response: any) {
  try {
    let { content, type } = request.body;
    // The global escapePayload middleware escapes HTML tags in POST body strings.
    // We need the raw HTML template, so unescape it.
    if (typeof content === 'string') {
      content = unescapeHtml(content);
    }

    if (!content || !type) {
      response.status(400).json({
        success: false,
        message: 'Le contenu et le type sont requis'
      });
      return;
    }

    let companyInfo: Partial<CompanyInfo> = {};
    try {
      if (config.has('orderDocuments.company')) {
        companyInfo = config.get('orderDocuments.company') as Partial<CompanyInfo>;
      }
      if (!companyInfo.name) {
        companyInfo.name = getBrandStoreNameFallback();
      }
      if (!companyInfo.name && config.has('shop.name')) {
        companyInfo.name = config.get('shop.name') as string;
      }
    } catch { /* defaults */ }

    const sampleOrder = getSampleOrder();
    const html = renderDocumentFromString(
      sampleOrder,
      type as DocumentType,
      content,
      companyInfo
    );

    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.send(html);
  } catch (error: any) {
    console.error('Error previewing template:', error);
    response.status(500).json({
      success: false,
      message: `Erreur : ${error.message}`
    });
  }
}
