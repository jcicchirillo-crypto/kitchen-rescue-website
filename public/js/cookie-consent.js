/**
 * Cookie consent — single source of truth for the public site.
 *
 * Loads Google Analytics + Meta Pixel only after the visitor accepts.
 * Preference stored in localStorage (kitchenRescueCookieConsent).
 *
 * Ad campaign pages are excluded so Meta/Google tracking is not delayed
 * or blocked (see AD_CAMPAIGN_PATHS). Do not add this script to those pages
 * either — they keep their own immediate pixel tags.
 */
(function () {
    'use strict';

    var COOKIE_CONSENT_KEY = 'kitchenRescueCookieConsent';
    var LEGACY_CONSENT_KEY = 'cookieConsent';
    var GA_ID = 'G-9G81ZHPHGF';
    var FB_PIXEL_ID = '1166460888955394';

    /** Landing pages for paid ads — leave tracking alone. */
    var AD_CAMPAIGN_PATHS = [
        '/trade-landing.html',
        '/trade-landing'
    ];

    function currentPath() {
        try {
            return (window.location.pathname || '').replace(/\/+$/, '') || '/';
        } catch (e) {
            return '';
        }
    }

    function isAdCampaignPage() {
        if (document.documentElement && document.documentElement.getAttribute('data-ad-campaign') === 'true') {
            return true;
        }
        var path = currentPath().toLowerCase();
        return AD_CAMPAIGN_PATHS.some(function (p) {
            return path === p || path.endsWith(p);
        });
    }

    function getCookieConsent() {
        var raw = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (raw) {
            try {
                return JSON.parse(raw);
            } catch (e) {
                return null;
            }
        }

        // Migrate older homepage key (accepted / rejected)
        var legacy = localStorage.getItem(LEGACY_CONSENT_KEY);
        if (legacy === 'accepted') {
            var accepted = { analytics: true, timestamp: new Date().toISOString() };
            localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(accepted));
            localStorage.removeItem(LEGACY_CONSENT_KEY);
            return accepted;
        }
        if (legacy === 'rejected') {
            var rejected = { analytics: false, timestamp: new Date().toISOString() };
            localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(rejected));
            localStorage.removeItem(LEGACY_CONSENT_KEY);
            return rejected;
        }
        return null;
    }

    function setCookieConsent(analytics) {
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
            analytics: !!analytics,
            timestamp: new Date().toISOString()
        }));
        localStorage.removeItem(LEGACY_CONSENT_KEY);
    }

    function clearCookieConsent() {
        localStorage.removeItem(COOKIE_CONSENT_KEY);
        localStorage.removeItem(LEGACY_CONSENT_KEY);
    }

    function loadAnalytics() {
        var consent = getCookieConsent();
        if (!consent || !consent.analytics) return;

        window['ga-disable-' + GA_ID] = false;

        if (typeof window.gtag !== 'function') {
            var gaScript = document.createElement('script');
            gaScript.async = true;
            gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
            document.head.appendChild(gaScript);

            window.dataLayer = window.dataLayer || [];
            window.gtag = function () {
                window.dataLayer.push(arguments);
            };
            window.gtag('js', new Date());
            window.gtag('config', GA_ID);
        }

        if (typeof window.fbq !== 'function') {
            !(function (f, b, e, v, n, t, s) {
                if (f.fbq) return;
                n = f.fbq = function () {
                    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                };
                if (!f._fbq) f._fbq = n;
                n.push = n;
                n.loaded = !0;
                n.version = '2.0';
                n.queue = [];
                t = b.createElement(e);
                t.async = !0;
                t.src = v;
                s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s);
            })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
            window.fbq('init', FB_PIXEL_ID);
            window.fbq('track', 'PageView');
        }
    }

    function ensureBanner() {
        var banner = document.getElementById('cookieBanner');
        if (banner) return banner;

        banner = document.createElement('div');
        banner.id = 'cookieBanner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Cookie consent');
        banner.style.cssText = 'display:none;position:fixed;bottom:0;left:0;right:0;background:#111827;color:#fff;padding:1.25rem;box-shadow:0 -2px 10px rgba(0,0,0,0.12);z-index:1000;';
        banner.innerHTML =
            '<div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1.25rem;flex-wrap:wrap;">' +
            '<p style="margin:0;color:#e5e7eb;font-size:0.9rem;flex:1;min-width:240px;">' +
            'We use essential cookies to make our site work and analytics cookies to understand how you use our site. ' +
            '<a href="/privacy-policy.html" style="color:#f87171;text-decoration:underline;">Learn more</a>' +
            '</p>' +
            '<div style="display:flex;gap:0.75rem;flex-wrap:wrap;">' +
            '<button type="button" id="acceptCookies" style="background:#dc2626;color:#fff;border:none;padding:0.55rem 1.1rem;border-radius:0.5rem;font-weight:600;cursor:pointer;font-size:0.875rem;">Accept All</button>' +
            '<button type="button" id="rejectCookies" style="background:transparent;color:#e5e7eb;border:1px solid #6b7280;padding:0.55rem 1.1rem;border-radius:0.5rem;font-weight:600;cursor:pointer;font-size:0.875rem;">Essential Only</button>' +
            '</div></div>';
        document.body.appendChild(banner);
        return banner;
    }

    function hideBanner(banner) {
        if (banner) banner.style.display = 'none';
    }

    function showBanner(banner) {
        if (banner) banner.style.display = 'block';
    }

    function wireControls(banner) {
        var acceptBtn = document.getElementById('acceptCookies');
        var rejectBtn = document.getElementById('rejectCookies');
        var settingsLink = document.getElementById('cookieSettingsLink');

        if (acceptBtn && !acceptBtn.dataset.consentBound) {
            acceptBtn.dataset.consentBound = '1';
            acceptBtn.addEventListener('click', function () {
                setCookieConsent(true);
                hideBanner(banner);
                loadAnalytics();
            });
        }

        if (rejectBtn && !rejectBtn.dataset.consentBound) {
            rejectBtn.dataset.consentBound = '1';
            rejectBtn.addEventListener('click', function () {
                setCookieConsent(false);
                window['ga-disable-' + GA_ID] = true;
                hideBanner(banner);
            });
        }

        if (settingsLink && !settingsLink.dataset.consentBound) {
            settingsLink.dataset.consentBound = '1';
            settingsLink.addEventListener('click', function (e) {
                e.preventDefault();
                clearCookieConsent();
                showBanner(banner);
            });
        }
    }

    function init() {
        if (isAdCampaignPage()) {
            return;
        }

        var banner = ensureBanner();
        wireControls(banner);

        var consent = getCookieConsent();
        if (consent === null) {
            showBanner(banner);
        } else if (consent.analytics) {
            loadAnalytics();
        } else {
            window['ga-disable-' + GA_ID] = true;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.KitchenRescueCookieConsent = {
        getConsent: getCookieConsent,
        setConsent: setCookieConsent,
        clearConsent: clearCookieConsent,
        loadAnalytics: loadAnalytics,
        isAdCampaignPage: isAdCampaignPage
    };
})();
