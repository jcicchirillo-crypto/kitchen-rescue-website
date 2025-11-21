// PDF builder using Puppeteer
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { renderClientQuoteHTML } = require('./pdfTemplates/clientQuoteTemplate');

async function buildClientQuotePdf(params) {
  const html = renderClientQuoteHTML(params);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const fileName = `client-quote-${Date.now()}.pdf`;
  const quotesDir = path.join(process.cwd(), 'public', 'quotes');
  const filePath = path.join(quotesDir, fileName);

  // Ensure folder exists
  await fs.mkdir(quotesDir, { recursive: true });

  await page.pdf({
    path: filePath,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '12mm', bottom: '14mm', left: '12mm' }
  });

  await browser.close();

  // Public URL you can store/send
  const publicUrl = `/quotes/${fileName}`;
  return { filePath, publicUrl };
}

module.exports = { buildClientQuotePdf };

