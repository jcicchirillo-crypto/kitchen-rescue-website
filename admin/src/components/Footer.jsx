import { Link } from "react-router-dom";
import { BUSINESS } from "../config/business";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <nav className="flex flex-wrap gap-4 text-sm" aria-label="Footer navigation">
          <Link to="/privacy" className="text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline">
            Terms & Conditions
          </Link>
          <Link to="/refunds" className="text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline">
            Refund Policy
          </Link>
          <Link to="/accessibility" className="text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline">
            Accessibility
          </Link>
        </nav>

        <p className="mt-6 text-sm text-slate-600 opacity-80">
          © {new Date().getFullYear()} {BUSINESS.tradingName}. {BUSINESS.legalEntityName} (Company No.{" "}
          {BUSINESS.companyNumber}) VAT No. {BUSINESS.vatNumber}.
        </p>
        <p className="text-sm text-slate-600 opacity-80">{BUSINESS.tradingAddress}</p>
      </div>
    </footer>
  );
}

