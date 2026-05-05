import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics.js';

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const { initGA } = useGoogleAnalytics();

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Small delay to ensure smooth entry animation after initial render
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    initGA();
    closeBanner();
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    closeBanner();
  };

  const closeBanner = () => {
    setIsFadingOut(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 transition-all duration-300 ease-in-out transform ${
        isFadingOut ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
      }`}
    >
      <Card className="max-w-5xl mx-auto p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl border-border/50 bg-card/95 backdrop-blur-md text-card-foreground rounded-2xl">
        <div className="text-sm text-muted-foreground flex-1 leading-relaxed">
          <p className="text-base font-semibold text-foreground mb-2 tracking-tight">We value your privacy</p>
          We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic using Google Analytics. By clicking "Accept", you consent to our use of cookies for these marketing and analytical purposes.
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <Button 
            variant="outline" 
            onClick={handleReject}
            className="w-full sm:w-auto font-medium"
          >
            Reject All
          </Button>
          <Button 
            onClick={handleAccept}
            className="w-full sm:w-auto font-medium shadow-md"
          >
            Accept All
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsentBanner;