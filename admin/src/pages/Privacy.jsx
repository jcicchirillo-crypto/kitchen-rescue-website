import { BUSINESS } from "../config/business";

export default function PrivacyPage() {
  return (
    <div id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-600">Last updated: 5 January 2026</p>
      
      <div className="mt-8 prose prose-slate max-w-none">
        <p>
          This Privacy Policy applies to services provided by <strong>{BUSINESS.legalEntityName}</strong> trading as <strong>{BUSINESS.tradingName}</strong>.
        </p>
        
        <h2 className="mt-8 text-xl font-semibold">How we use your information</h2>
        <p className="mt-2">
          We use the information you provide to process bookings, send confirmations, and communicate with you about your hire.
        </p>
        
        <h2 className="mt-8 text-xl font-semibold">Data sharing</h2>
        <p className="mt-2">
          We may share your information with payment processors (Stripe) and delivery partners as necessary to fulfil your booking.
        </p>
        
        <h2 className="mt-8 text-xl font-semibold">Your rights</h2>
        <p className="mt-2">
          You have the right to access, correct, or delete your personal data. Contact us at {BUSINESS.supportEmail} to exercise these rights.
        </p>
        
        <h2 className="mt-8 text-xl font-semibold">Contact</h2>
        <p className="mt-2">
          For questions about this privacy policy, please contact us:
        </p>
        <ul className="mt-2 list-disc pl-6">
          <li>Email: <a href={`mailto:${BUSINESS.supportEmail}`} className="text-blue-600 hover:underline">{BUSINESS.supportEmail}</a></li>
          <li>Phone: <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`} className="text-blue-600 hover:underline">{BUSINESS.phone}</a></li>
        </ul>
      </div>
    </div>
  );
}

