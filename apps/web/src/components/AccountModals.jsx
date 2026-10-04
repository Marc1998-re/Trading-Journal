import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const CreateAccountModal = ({ isOpen, onClose, onCreate }) => {
  const [accountName, setAccountName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setAccountName('');
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onCreate(accountName.trim());
      onClose();
    } catch (error) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Trading-Konto erstellen</DialogTitle>
          <DialogDescription>
            Erstelle ein neues Konto, um deine Trades sauber zu segmentieren.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="accountName">Kontoname</Label>
            <Input
              id="accountName"
              placeholder="z. B. Apex 100k Challenge"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting || !accountName.trim()}>
              {isSubmitting ? 'Wird erstellt...' : 'Konto erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const RenameAccountModal = ({ isOpen, onClose, onRename, account }) => {
  const [accountName, setAccountName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && account) {
      setAccountName(account.accountName);
    }
  }, [isOpen, account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim() || !account || accountName.trim() === account.accountName) return;
    
    setIsSubmitting(true);
    try {
      await onRename(account.id, accountName.trim());
      onClose();
    } catch (error) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Trading-Konto umbenennen</DialogTitle>
          <DialogDescription>
            Ändere den Namen deines Trading-Kontos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="renameAccountName">Kontoname</Label>
            <Input
              id="renameAccountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting || !accountName.trim() || accountName.trim() === account?.accountName}>
              {isSubmitting ? 'Speichern...' : 'Änderungen speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const DeleteAccountModal = ({ isOpen, onClose, onDelete, account, availableAccounts }) => {
  const [targetAccountId, setTargetAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherAccounts = availableAccounts.filter(a => a.id !== account?.id);
  const canDelete = otherAccounts.length > 0;

  useEffect(() => {
    if (isOpen && otherAccounts.length > 0) {
      setTargetAccountId(otherAccounts[0].id);
    } else {
      setTargetAccountId('');
    }
  }, [isOpen, account, availableAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account || !targetAccountId) return;
    
    setIsSubmitting(true);
    try {
      await onDelete(account.id, targetAccountId);
      onClose();
    } catch (error) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Konto löschen
          </DialogTitle>
          <DialogDescription>
            Möchtest du <strong>{account?.accountName}</strong> wirklich löschen?
          </DialogDescription>
        </DialogHeader>
        
        {canDelete ? (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
              <AlertDescription>
                Alle Trades dieses Kontos müssen vor dem Löschen einem anderen Konto zugewiesen werden.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="targetAccount">Trades zuweisen an:</Label>
              <Select value={targetAccountId} onValueChange={setTargetAccountId} required>
                <SelectTrigger id="targetAccount">
                  <SelectValue placeholder="Konto auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {otherAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.accountName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Abbrechen
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting || !targetAccountId}>
                {isSubmitting ? 'Löschen...' : 'Löschen & zuweisen'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-6 pt-2">
            <Alert className="bg-muted border-border">
              <AlertDescription>
                Du kannst dein einziges Trading-Konto nicht löschen. Bitte erstelle zuerst ein weiteres Konto, wenn du dieses löschen möchtest.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="w-full">
                Schließen
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
