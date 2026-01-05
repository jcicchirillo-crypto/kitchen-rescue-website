// Cookie Consent Management for Admin App
export const CONSENT_KEY = "tkr_cookie_consent"; // "all" | "essential"

export function getConsent(): "all" | "essential" | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(CONSENT_KEY);
  return v === "all" || v === "essential" ? v : null;
}

export function setConsent(v: "all" | "essential") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, v);
}

