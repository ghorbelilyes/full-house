import { loadOrderData } from '../../services/orderDataLoader.js';
import { renderDocument, DocumentType, CompanyInfo } from '../../services/templateRenderer.js';
import { generatePdf } from '../../services/pdfGenerator.js';
import config from 'config';

const VALID_TYPES: DocumentType[] = ['facture', 'bon_commande', 'bon_livraison'];

export default async function generateDocumentHandler(
  request: any,
  response: any,
  next: any
) {
  try {
    const { id, type } = request.params;
    const format = request.query.format || 'pdf'; // pdf or html

    if (!VALID_TYPES.includes(type as DocumentType)) {
      response.status(400).json({
        success: false,
        message: `Type de document invalide. Types valides : ${VALID_TYPES.join(', ')}`
      });
      return;
    }

    // Load the order
    const order = await loadOrderData(id);
    if (!order) {
      response.status(404).json({
        success: false,
        message: 'Commande introuvable'
      });
      return;
    }

    // Load company info from config if available
    let companyInfo: Partial<CompanyInfo> = {};
    try {
      if (config.has('orderDocuments.company')) {
        companyInfo = config.get('orderDocuments.company') as Partial<CompanyInfo>;
      }
    } catch { /* use defaults */ }

    // Merge with shop name from config
    try {
      if (!companyInfo.name && config.has('shop.name')) {
        companyInfo.name = config.get('shop.name') as string;
      }
    } catch { /* ignore */ }

    // Render HTML (async — checks DB for custom template, then falls back to file)
    const html = await renderDocument(order, type as DocumentType, companyInfo);

    if (format === 'html') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.send(html);
      return;
    }

    // Generate PDF
    const pdfBuffer = await generatePdf(html);

    const filename = `${type}-${order.order_number}.pdf`;
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    response.setHeader('Content-Length', pdfBuffer.length);
    response.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating document:', error);
    response.status(500).json({
      success: false,
      message: `Erreur lors de la génération du document : ${error.message}`
    });
  }
}
