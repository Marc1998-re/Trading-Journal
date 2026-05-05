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
            <DialogTitle className="text-2xl font-semibold tracking-tight">Cookie Preferences</DialogTitle>
            <DialogDescription className="text-base mt-2">
              Manage your cookie settings. We use Google Analytics to measure traffic and improve our website experience.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
              <div>
                <p className="font-medium text-foreground">Current Status</p>
                <p className="text-sm text-muted-foreground capitalize mt-1">
                  {status === 'pending' ? 'Not Set' : status}
                </p>
              </div>
              {status === 'accepted' && <CheckCircle2 className="w-6 h-6 text-success" />}
              {status === 'rejected' && <XCircle className="w-6 h-6 text-destructive" />}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">What data is collected?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Accepting cookies allows us to collect anonymized data about your visit, such as pages viewed, time spent on site, and general location. Rejecting will disable Google Analytics tracking entirely. Essential cookies required for the site to function (like authentication) cannot be disabled.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 sm:p-8 bg-muted/30 border-t border-border/50">
          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => handleSave('rejected')} className="w-full sm:w-auto">
              Reject Analytics
            </Button>
            <Button onClick={() => handleSave('accepted')} className="w-full sm:w-auto">
              Accept Analytics
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePreferencesModal;