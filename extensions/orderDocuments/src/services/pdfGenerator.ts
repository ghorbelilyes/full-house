import puppeteer from 'puppeteer-core';

/**
 * Generate a PDF buffer from an HTML string
 */
export async function generatePdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#999;text-align:center;padding:0 15mm;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
