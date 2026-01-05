import { useState, useEffect } from "react";
import { getConsent, setConsent } from "../lib/consent";
import { Button } from "./ui/button";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show banner if consent hasn't been given yet
    const consent = getConsent();
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    setConsent("all");
    setShow(false);
    // Dispatch event so AnalyticsGate can react
    window.dispatchEvent(new Event("consentChanged"));
  };

  const handleEssential = () => {
    setConsent("essential");
    setShow(false);
    // Dispatch event so AnalyticsGate can react
    window.dispatchEvent(new Event("consentChanged"));
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 z-50 shadow-lg">
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm">
            We use essential cookies to make our site work and analytics cookies to understand how you use our site.{" "}
            <a href="/privacy" className="text-blue-400 hover:underline">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEssential}
            className="bg-transparent border-slate-600 text-white hover:bg-slate-800"
          >
            Essential Only
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleAccept}
            className="bg-red-600 hover:bg-red-700"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}

