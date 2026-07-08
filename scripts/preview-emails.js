// Generates HTML previews of the customer emails with sample data.
// Usage: node scripts/preview-emails.js  → writes files into ./email-previews/
const fs = require('fs');
const path = require('path');
const app = require('../api/server');

const sample = {
    name: 'Sarah Thompson',
    fullName: 'Sarah Thompson',
    email: 'sarah@example.com',
    id: 'KR482913',
    bookingReference: 'KR482913',
    deliveryDate: '2026-07-19',
    startDate: '2026-07-19',
    hireLength: 14,
    days: 14,
    totalCost: 1120,
    balance: 1120,
    dueDate: '2026-07-12',
    deliveryAddress: '14 Meadow Lane, Watford, WD17 3AB',
};

const outDir = path.join(__dirname, '..', 'email-previews');
fs.mkdirSync(outDir, { recursive: true });

// Inline the logo as a data URI so previews show the real asset without needing
// the live site (the email itself still uses the hosted URL).
const logoPath = path.join(__dirname, '..', 'public', 'assets', 'logo-email.png');
let logoDataUri = null;
try {
    logoDataUri = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');
} catch (_) {}
const inlineLogo = (html) => logoDataUri
    ? html.replace(/https:\/\/www\.thekitchenrescue\.co\.uk\/assets\/logo-email\.png/g, logoDataUri)
    : html;

fs.writeFileSync(path.join(outDir, 'booking-confirmed.html'), inlineLogo(app.generateBookingConfirmedEmailHTML(sample)));
fs.writeFileSync(path.join(outDir, 'balance-reminder.html'), inlineLogo(app.generateBalanceReminderEmailHTML(sample)));

const quoteSample = {
    name: 'Sarah Thompson',
    email: 'sarah@example.com',
    phone: '07342 606655',
    postcode: 'WD17 3AB',
    selectedDates: ['2026-07-19', '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26', '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01'],
    startDate: '2026-07-19',
    endDate: '2026-08-01',
    days: 14,
    dailyRate: 60,
    dailyCost: 840,
    deliveryCost: 75,
    collectionCost: 75,
    totalCost: 990,
    notes: 'Driveway access from left side.',
};

fs.writeFileSync(path.join(outDir, 'custom-quote.html'), inlineLogo(app.generateQuoteEmailHTML(quoteSample)));

function buildCompareOption(startDate, weeks, deliveryCost, collectionCost) {
    const days = weeks * 7;
    const end = new Date(startDate + 'T00:00:00Z');
    end.setUTCDate(end.getUTCDate() + days - 1);
    const endDate = end.toISOString().slice(0, 10);
    const dailyRate = days >= 28 ? 45 : days >= 21 ? 50 : 60;
    const dailyCost = days * dailyRate;
    const deliv = Number(deliveryCost) || 0;
    const coll = Number(collectionCost) || 0;
    return {
        weeks,
        days,
        startDate,
        endDate,
        dailyRate,
        dailyCost,
        deliveryCost: deliv,
        collectionCost: coll,
        totalCost: dailyCost + deliv + coll,
    };
}

const compareStart = '2026-07-19';
const compareDeliv = 75;
const compareColl = 75;
const compareOptions = [3, 4, 5, 6].map((w) => buildCompareOption(compareStart, w, compareDeliv, compareColl));

const compareQuoteSample = {
    name: 'Sarah Thompson',
    email: 'sarah@example.com',
    phone: '07342 606655',
    postcode: 'WD17 3AB',
    startDate: compareStart,
    endDate: compareOptions[compareOptions.length - 1].endDate,
    days: compareOptions[0].days,
    dailyRate: compareOptions[0].dailyRate,
    dailyCost: compareOptions[0].dailyCost,
    deliveryCost: compareDeliv,
    collectionCost: compareColl,
    totalCost: compareOptions[0].totalCost,
    notes: 'Driveway access from left side.',
    durationOptions: compareOptions,
};

fs.writeFileSync(path.join(outDir, 'custom-quote-compare.html'), inlineLogo(app.generateQuoteEmailHTML(compareQuoteSample)));

console.log('Wrote previews to', outDir);
