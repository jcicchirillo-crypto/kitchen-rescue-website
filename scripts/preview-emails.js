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

console.log('Wrote previews to', outDir);
