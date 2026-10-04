import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SymbolCombobox } from '@/components/SymbolCombobox.jsx';
import { useSymbols } from '@/hooks/useSymbols.js';
import { useAccount } from '@/contexts/AccountContext.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';
import { Save, X } from 'lucide-react';
import { calculateStopLossInEuro } from '@/lib/tradeCalculations.js';

const EditTradeModal = ({ trade, open, onClose, onSaved }) => {
  const { symbols, addSymbol } = useSymbols();
  const { accounts } = useAccount();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [startingBalance, setStartingBalance] = useState(10000);
  const [formData, setFormData] = useState({
    accountId: '',
    symbol: '',
    entryDate: '',
    entryTime: '',
    stopLoss: '',
    rrSecured: '',
    status: '',
    commissionPercentage: '',
    contextUrl: '',
    validationUrl: '',
    entryUrl: '',
    notes: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUser?.id) return;
      try {
        const result = await pb.collection('userSettings').getList(1, 1, {
          filter: `userId="${currentUser.id}"`,
          $autoCancel: false
        });
        if (result.items.length > 0) {
          setStartingBalance(result.items[0].startingBalance);
        }
      } catch (err) {
        console.error('Failed to fetch user settings:', err);
      }
    };
    if (open) {
      fetchSettings();
    }
  }, [currentUser?.id, open]);

  useEffect(() => {
    if (trade) {
      setFormData({
        accountId: trade.accountId || (accounts.length > 0 ? accounts[0].id : ''),
        symbol: trade.symbol || trade.instrument || '',
        entryDate: trade.entryDate ? trade.entryDate.split(' ')[0] : (trade.date ? trade.date.split(' ')[0] : ''),
        entryTime: trade.entryTime || trade.time || '',
        stopLoss: trade.stopLoss || '',
        rrSecured: trade.rrSecured || '',
        status: trade.status || '',
        commissionPercentage: trade.commissionPercentage || '',
        contextUrl: trade.contextUrl || '',
        validationUrl: trade.validationUrl || '',
        entryUrl: trade.entryUrl || '',
        notes: trade.notes || '',
      });
    }
  }, [trade, accounts]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const deriveStatus = (rr) => {
    if (rr >= 1) return 'Win';
    if (rr < 0) return 'Loss';
    return 'Breakeven';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.accountId) {
      toast.error('Konto ist erforderlich.');
      return;
    }

    if (!formData.symbol.trim()) {
      toast.error('Symbol ist erforderlich.');
      return;
    }

    setLoading(true);
    try {
      // Save the symbol to the user's symbols collection if it's new
      await addSymbol(formData.symbol);

      const stopLossVal = parseFloat(formData.stopLoss) || 0;
      const rrSecuredVal = parseFloat(formData.rrSecured) || 0;
      const derivedStatus = formData.status || deriveStatus(rrSecuredVal);
      
      const monetaryStopLoss = calculateStopLossInEuro(startingBalance, stopLossVal);
      const profitLossVal = monetaryStopLoss * rrSecuredVal;

      const formattedDate = formData.entryDate ? `${formData.entryDate} 12:00:00.000Z` : null;

      const updateData = {
        accountId: formData.accountId,
        symbol: formData.symbol.trim().toUpperCase(),
        instrument: formData.symbol.trim().toUpperCase(), // Sync with legacy schema field
        entryDate: formattedDate,
        date: formattedDate, // Sync with legacy schema field
        entryTime: formData.entryTime || null,
        time: formData.entryTime || null,
        stopLoss: stopLossVal,
        rrSecured: rrSecuredVal,
        riskRewardRatio: rrSecuredVal,
        status: derivedStatus,
        commissionPercentage: parseFloat(formData.commissionPercentage) || 0,
        profitLoss: profitLossVal,
        contextUrl: formData.contextUrl || '',
        validationUrl: formData.validationUrl || '',
        entryUrl: formData.entryUrl || '',
        notes: formData.notes || '',
      };

      await pb.collection('trades').update(trade.id, updateData, { $autoCancel: false });
      toast.success('Trade erfolgreich aktualisiert.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Trade konnte nicht aktualisiert werden.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trade bearbeiten</DialogTitle>
          <DialogDescription>Aktualisiere die wichtigsten Trade-Details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <Label htmlFor="editAccountId">Konto *</Label>
              <Select 
                value={formData.accountId} 
                onValueChange={(val) => handleSelectChange('accountId', val)}
                required
              >
                <SelectTrigger id="editAccountId" className="bg-background text-foreground">
                  <SelectValue placeholder="Konto auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.accountName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editSymbol">Symbol *</Label>
              <SymbolCombobox 
                value={formData.symbol} 
                onChange={(val) => handleSelectChange('symbol', val)} 
                symbols={symbols} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEntryDate">Einstiegsdatum *</Label>
              <Input
                id="editEntryDate"
                name="entryDate"
                type="date"
                value={formData.entryDate}
                onChange={handleChange}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEntryTime">Einstiegszeit *</Label>
              <Input
                id="editEntryTime"
                name="entryTime"
                type="time"
                value={formData.entryTime}
                onChange={handleChange}
                required
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editStopLoss">Stop Loss (%) *</Label>
              <Input
                id="editStopLoss"
                name="stopLoss"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.stopLoss}
                onChange={handleChange}
                placeholder="z. B. 1.0"
                required
                className="bg-background text-foreground"
              />
              {formData.stopLoss && !isNaN(parseFloat(formData.stopLoss)) && (
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Stop Loss: {formData.stopLoss}% von €{startingBalance.toLocaleString()} = €{calculateStopLossInEuro(startingBalance, formData.stopLoss).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRrSecured">Gesichertes RR *</Label>
              <Input
                id="editRrSecured"
                name="rrSecured"
                type="number"
                step="0.01"
                value={formData.rrSecured}
                onChange={handleChange}
                placeholder="0.00"
                required
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val) => handleSelectChange('status', val)}
              >
                <SelectTrigger id="editStatus" className="bg-background text-foreground">
                  <SelectValue placeholder="Automatisch berechnen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Win">Gewinn</SelectItem>
                  <SelectItem value="Loss">Verlust</SelectItem>
                  <SelectItem value="Breakeven">Break-even</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editCommissionPercentage">Gebühr (%)</Label>
              <Input
                id="editCommissionPercentage"
                name="commissionPercentage"
                type="number"
                step="0.001"
                value={formData.commissionPercentage}
                onChange={handleChange}
                className="bg-background text-foreground"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editContextUrl">Kontext URL</Label>
              <Input
                id="editContextUrl"
                name="contextUrl"
                type="url"
                value={formData.contextUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editValidationUrl">Validierungs URL</Label>
              <Input
                id="editValidationUrl"
                name="validationUrl"
                type="url"
                value={formData.validationUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEntryUrl">Einstiegs URL</Label>
              <Input
                id="editEntryUrl"
                name="entryUrl"
                type="url"
                value={formData.entryUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes">Notizen</Label>
              <Textarea
                id="editNotes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Trade-Setup, Marktbedingungen, Learnings..."
                rows={3}
                className="bg-background text-foreground resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Änderungen speichern
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTradeModal;
