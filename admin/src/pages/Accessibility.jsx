import { BUSINESS } from "../config/business";

export default function AccessibilityPage() {
  return (
    <div id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Accessibility Statement</h1>
      <p className="mt-4">
        We want everyone to be able to use {BUSINESS.tradingName}. We aim to make our website accessible
        and usable for as many people as possible.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Standard we aim to meet</h2>
      <p className="mt-2">
        We aim to meet the requirements of <strong>WCAG 2.2 AA</strong>.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Feedback and contact</h2>
      <p className="mt-2">
        If you have difficulty using this website, or you need information in a different format, please contact us:
      </p>
      <ul className="mt-2 list-disc pl-6">
        <li>Email: <a href={`mailto:${BUSINESS.supportEmail}`} className="text-blue-600 hover:underline">{BUSINESS.supportEmail}</a></li>
        <li>Phone: <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`} className="text-blue-600 hover:underline">{BUSINESS.phone}</a></li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Known issues</h2>
      <p className="mt-2">
        We are continually improving. If you find an issue, please tell us and we'll prioritise a fix.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Preparation of this statement</h2>
      <p className="mt-2">Last reviewed: 5 January 2026</p>
    </div>
  );
}

