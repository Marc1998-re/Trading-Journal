import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGoogleAnalytics, GA_MEASUREMENT_ID } from '@/hooks/useGoogleAnalytics.js';

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

  if (!isVisible || !GA_MEASUREMENT_ID) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 transition-all duration-300 ease-in-out transform ${
        isFadingOut ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
      }`}
    >
      <Card className="max-w-5xl mx-auto p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl border-border/50 bg-card/95 backdrop-blur-md text-card-foreground rounded-2xl">
        <div className="text-sm text-muted-foreground flex-1 leading-relaxed">
          <p className="text-base font-semibold text-foreground mb-2 tracking-tight">Deine Privatsphäre ist uns wichtig</p>
          Wir verwenden Cookies, um die Nutzung der Website zu analysieren und die Erfahrung zu verbessern. Mit „Akzeptieren“ stimmst du der Nutzung von Analyse-Cookies zu. Essenzielle Cookies für Anmeldung und Sicherheit bleiben aktiv.
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <Button 
            variant="outline" 
            onClick={handleReject}
            className="w-full sm:w-auto font-medium"
          >
            Alle ablehnen
          </Button>
          <Button 
            onClick={handleAccept}
            className="w-full sm:w-auto font-medium shadow-md"
          >
            Akzeptieren
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsentBanner;
