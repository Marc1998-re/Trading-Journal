import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics.js';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';

const CookiePreferencesModal = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState('pending');
  const { initGA } = useGoogleAnalytics();

  useEffect(() => {
    if (isOpen) {
      setStatus(localStorage.getItem('cookieConsent') || 'pending');
    }
  }, [isOpen]);

  const handleSave = (newStatus) => {
    const previousStatus = localStorage.getItem('cookieConsent');
    localStorage.setItem('cookieConsent', newStatus);
    setStatus(newStatus);
    
    if (newStatus === 'accepted') {
      initGA();
    } else if (previousStatus === 'accepted' && newStatus === 'rejected') {
      // If user changes from accepted to rejected, reload to clear GA scripts from memory
      window.location.reload();
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl">
        <div className="p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-semibold tracking-tight">Cookie-Einstellungen</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Verwalte deine Cookie-Einstellungen. Wir nutzen Google Analytics, um Traffic zu messen und die Website-Erfahrung zu verbessern.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
              <div>
                <p className="font-medium text-foreground">Aktueller Status</p>
                <p className="text-sm text-muted-foreground capitalize mt-1">
                  {status === 'pending' ? 'Nicht gesetzt' : status === 'accepted' ? 'Akzeptiert' : 'Abgelehnt'}
                </p>
              </div>
              {status === 'accepted' && <CheckCircle2 className="w-6 h-6 text-success" />}
              {status === 'rejected' && <XCircle className="w-6 h-6 text-destructive" />}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Welche Daten werden erfasst?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Wenn du Analyse-Cookies akzeptierst, können wir anonymisierte Daten zu deinem Besuch erfassen, zum Beispiel aufgerufene Seiten, Verweildauer und grobe Region. Bei Ablehnung wird Google Analytics deaktiviert. Essenzielle Cookies für Anmeldung und Seitenfunktion können nicht deaktiviert werden.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 sm:p-8 bg-muted/30 border-t border-border/50">
          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => handleSave('rejected')} className="w-full sm:w-auto">
              Analyse ablehnen
            </Button>
            <Button onClick={() => handleSave('accepted')} className="w-full sm:w-auto">
              Analyse akzeptieren
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePreferencesModal;
