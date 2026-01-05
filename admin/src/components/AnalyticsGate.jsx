import { useEffect, useState } from "react";
import { getConsent } from "../lib/consent";

// Google Analytics ID - replace with your actual GA ID
const GA_ID = "G-9G81ZHPHGF";

export function AnalyticsGate() {
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    // Check consent on mount
    setAllow(getConsent() === "all");
    
    // Listen for consent changes (if consent banner updates localStorage)
    const handleStorageChange = (e) => {
      if (e.key === "tkr_cookie_consent") {
        setAllow(e.newValue === "all");
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Also listen for custom events if consent is set in the same window
    const handleConsentChange = () => {
      setAllow(getConsent() === "all");
    };
    
    window.addEventListener("consentChanged", handleConsentChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("consentChanged", handleConsentChange);
    };
  }, []);

  useEffect(() => {
    if (!allow) return;

    // Check if GA is already loaded
    if (window.gtag && window.dataLayer) {
      // Already initialized, just reconfigure
      window.gtag("config", GA_ID, { anonymize_ip: true });
      return;
    }

    // Load Google Analytics script
    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script1);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });

    return () => {
      // Note: We don't remove the script on unmount as GA should persist
      // The consent check prevents it from loading in the first place
    };
  }, [allow]);

  return null; // This component doesn't render anything
}

