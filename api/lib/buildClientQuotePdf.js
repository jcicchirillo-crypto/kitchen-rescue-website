// PDF builder using Puppeteer Core with Chromium (Vercel-safe)
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium-min');
const { renderClientQuoteHTML } = require('./pdfTemplates/clientQuoteTemplate');

async function buildClientQuotePdf(params) {
  const html = renderClientQuoteHTML(params);

  const execPath = await chromium.executablePath();
  console.log('Chromium exec path:', execPath);

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: execPath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '12mm', bottom: '14mm', left: '12mm' }
  });

  console.log('PDF bytes:', pdfBuffer.length);

  await browser.close();

  // IMPORTANT: on Vercel we return a BUFFER (not a file path)
  return { pdfBuffer };
}

module.exports = { buildClientQuotePdf };

