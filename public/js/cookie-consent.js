// Cookie Consent Management
// Blocks Google Analytics and Facebook Pixel until user accepts cookies

(function() {
    'use strict';

    const COOKIE_CONSENT_KEY = 'kitchenRescueCookieConsent';
    const COOKIE_EXPIRY_DAYS = 365;

    // Check if user has already given consent
    function getCookieConsent() {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (consent) {
            try {
                return JSON.parse(consent);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    // Save cookie consent
    function setCookieConsent(analytics) {
        const consent = {
            analytics: analytics,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    }

    // Load analytics scripts if consent given
    function loadAnalytics() {
        const consent = getCookieConsent();
        if (!consent || !consent.analytics) {
            return; // Don't load analytics
        }

        // Load Google Analytics
        if (typeof gtag === 'undefined') {
            const script1 = document.createElement('script');
            script1.async = true;
            script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-9G81ZHPHGF';
            document.head.appendChild(script1);

            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', 'G-9G81ZHPHGF');
        }

        // Load Facebook Pixel
        if (typeof fbq === 'undefined') {
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1166460888955394');
            fbq('track', 'PageView');
        }
    }

    // Show cookie banner
    function showCookieBanner() {
        const banner = document.getElementById('cookieBanner');
        if (!banner) return;

        banner.style.display = 'block';

        // Accept all button
        const acceptBtn = document.getElementById('acceptCookies');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', function() {
                setCookieConsent(true);
                banner.style.display = 'none';
                loadAnalytics();
            });
        }

        // Essential only button
        const rejectBtn = document.getElementById('rejectCookies');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function() {
                setCookieConsent(false);
                banner.style.display = 'none';
            });
        }
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        const consent = getCookieConsent();
        
        if (consent === null) {
            // No consent given yet, show banner
            showCookieBanner();
        } else if (consent.analytics) {
            // Consent given, load analytics
            loadAnalytics();
        }
        // If consent.analytics is false, don't load analytics
    });

    // Export for manual triggering if needed
    window.KitchenRescueCookieConsent = {
        getConsent: getCookieConsent,
        setConsent: setCookieConsent,
        loadAnalytics: loadAnalytics
    };
})();

