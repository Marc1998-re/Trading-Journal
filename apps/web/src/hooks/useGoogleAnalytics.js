import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export const GA_MEASUREMENT_ID = 'G-ZD34FSE1G2';

export const useGoogleAnalytics = () => {
  const location = useLocation();

  const initGA = useCallback(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'accepted') {
      // Inject script if not exists
      let script = document.getElementById('ga-script');
      if (!script) {
        script = document.createElement('script');
        script.id = 'ga-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);
      }

      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      window.gtag = gtag;
      
      // Only initialize if not already initialized
      if (!window.gaInitialized) {
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
          page_path: window.location.pathname,
        });
        window.gaInitialized = true;
      }
    }
  }, []);

  const trackPageView = useCallback((path) => {
    if (window.gtag && localStorage.getItem('cookieConsent') === 'accepted') {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: path,
      });
    }
  }, []);

  const trackEvent = useCallback(({ action, category, label, value }) => {
    if (window.gtag && localStorage.getItem('cookieConsent') === 'accepted') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  }, []);

  // Initialize GA on mount if consent is already given
  useEffect(() => {
    initGA();
  }, [initGA]);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location, trackPageView]);

  return { initGA, trackPageView, trackEvent };
};