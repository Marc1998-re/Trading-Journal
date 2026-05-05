import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';

const DeleteAccountModal = ({ isOpen, onClose, onSuccess }) => {
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (isLoading) return;
    setPassword('');
    setIsConfirmed(false);
    setError('');
    onClose();
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!isConfirmed || !password) return;

    setIsLoading(true);
    setError('');

    try {
      await deleteAccount(password);
      onSuccess();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-6 w-[95vw] sm:w-full">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2 mx-auto sm:mx-0">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <DialogTitle className="text-2xl text-center sm:text-left">Delete Account</DialogTitle>
          <DialogDescription className="text-base text-center sm:text-left">
            This action is permanent. All your trades, settings, and associated data will be completely wiped from our servers and cannot be recovered.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleDelete} className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label htmlFor="delete-password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pl-10 h-11"
                required
                disabled={isLoading}
              />
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg border border-border/50">
            <Checkbox
              id="confirm-deletion"
              checked={isConfirmed}
              onCheckedChange={setIsConfirmed}
              disabled={isLoading}
              className="mt-1 h-5 w-5"
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="confirm-deletion"
                className="text-sm font-medium cursor-pointer leading-snug"
              >
                I understand this is permanent and cannot be undone
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isConfirmed || !password || isLoading}
              className="w-full sm:w-auto h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountModal;