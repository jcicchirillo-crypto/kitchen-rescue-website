// /api/lib/buildClientQuotePdf.js
// Vercel-safe PDF builder using pdf-lib (NO Chromium)

const { PDFDocument, StandardFonts } = require('pdf-lib');

async function buildClientQuotePdf({
  builderName = 'Your Kitchen Installer',
  clientPostcode,
  weeks,
  baseHire,
  deliveryFee,
  distanceMiles,
  totalClientPrice,
  startDate = null,
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const money = (n) => `£${Number(n).toFixed(2)}`;

  let y = 800;
  const left = 50;

  const line = (text, f = font, size = 12, gap = 18) => {
    page.drawText(text, { x: left, y, size, font: f });
    y -= gap;
  };

  // Title
  line('Temporary Kitchen Option', bold, 18, 28);
  line(`Installer: ${builderName}`, font, 12, 22);

  // Intro
  line(
    'A fully equipped temporary kitchen pod can be delivered to your driveway',
    font,
    12,
    16
  );
  line(
    'so you can cook, wash up, and live normally while your kitchen is renovated.',
    font,
    12,
    24
  );

  line('What's included:', bold, 13, 18);
  line('• Full-size oven & hob');
  line('• Fridge freezer');
  line('• Sink with hot water');
  line('• Full-size dishwasher');
  line('• Washing machine');
  line('• Worktop & storage', font, 12, 24);

  line('What you need on site:', bold, 13, 18);
  line('• Two standard double sockets');
  line('• Outdoor tap');
  line('• Normal drain access', font, 12, 24);

  line('Your temporary kitchen quote:', bold, 13, 22);
  line(`Postcode: ${clientPostcode}`);
  line(`Duration: ${weeks} week(s)`);
  if (startDate) line(`Estimated start date: ${startDate}`);
  y -= 8;
  line(`Base hire: ${money(baseHire)}`);
  line(`Delivery & collection: ${money(deliveryFee)}`);
  line(`Distance: ${Number(distanceMiles).toFixed(1)} miles`);
  y -= 8;
  line(`TOTAL: ${money(totalClientPrice)}`, bold, 14, 26);
  line('Quote valid for 30 days.', font, 11, 16);
  line(
    'Final booking and payment are handled directly by the temporary kitchen provider.',
    font,
    11,
    18
  );

  const pdfBytes = await pdfDoc.save();
  return { pdfBuffer: Buffer.from(pdfBytes) };
}

module.exports = { buildClientQuotePdf };
