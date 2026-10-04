import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useAccount } from '@/contexts/AccountContext.jsx';
import { useSymbols } from '@/hooks/useSymbols.js';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SymbolCombobox } from '@/components/SymbolCombobox.jsx';
import { toast } from 'sonner';
import { Plus, AlertTriangle, ChevronUp } from 'lucide-react';
import { calculateStopLossInEuro } from '@/lib/tradeCalculations.js';

const TradeEntryForm = ({ onTradeAdded }) => {
  const { currentUser } = useAuth();
  const { accounts, selectedAccountId } = useAccount();
  const { symbols, addSymbol } = useSymbols();

  // State management for all fields
  const [accountId, setAccountId] = useState('');
  const [symbol, setSymbol] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [stopLossPips, setStopLossPips] = useState('');
  const [rrSecured, setRrSecured] = useState('');
  const [status, setStatus] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [contextUrl, setContextUrl] = useState('');
  const [validationUrl, setValidationUrl] = useState('');
  const [entryUrl, setEntryUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [startingBalance, setStartingBalance] = useState(10000);
  const [globalCommission, setGlobalCommission] = useState(0);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);

  // Initialize selected account
  useEffect(() => {
    if (selectedAccountId) {
      setAccountId(selectedAccountId);
    } else if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [selectedAccountId, accounts]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUser?.id) return;
      try {
        const result = await pb.collection('userSettings').getList(1, 1, {
          filter: `userId="${currentUser.id}"`,
          $autoCancel: false
        });
        if (result.items.length > 0) {
          const settings = result.items[0];
          setStartingBalance(settings.startingBalance);
          setGlobalCommission(settings.commissionPercentage || 0);
          setCommissionPercentage((settings.commissionPercentage || 0).toString());
        }
      } catch (err) {
        console.error('Failed to fetch user settings:', err);
      }
    };
    fetchSettings();
  }, [currentUser?.id]);

  useEffect(() => {
    const checkDuplicate = async () => {
      if (!symbol.trim() || !currentUser?.id) {
        setDuplicateWarning('');
        return;
      }
      try {
        const recentTrades = await pb.collection('trades').getList(1, 5, {
          filter: `userId = "${currentUser.id}"`,
          sort: '-created',
          $autoCancel: false
        });
        const isDuplicate = recentTrades.items.some(trade => trade.symbol?.toLowerCase() === symbol.toLowerCase());
        if (isDuplicate) {
          setDuplicateWarning(`Du hast ${symbol} vor Kurzem gehandelt. Ist das eine neue Position?`);
        } else {
          setDuplicateWarning('');
        }
      } catch (err) {
        console.error('Error checking duplicates:', err);
      }
    };
    const debounce = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(debounce);
  }, [symbol, currentUser?.id]);

  const handleEntryDateChange = e => setEntryDate(e.target.value);
  const handleEntryTimeChange = e => setEntryTime(e.target.value);
  const handleStopLossChange = e => setStopLoss(e.target.value);
  const handleStopLossPipsChange = e => setStopLossPips(e.target.value);
  const handleRrSecuredChange = e => setRrSecured(e.target.value);
  const handleStatusChange = value => setStatus(value);
  const handleCommissionChange = e => setCommissionPercentage(e.target.value);
  const handleContextUrlChange = e => setContextUrl(e.target.value);
  const handleValidationUrlChange = e => setValidationUrl(e.target.value);
  const handleEntryUrlChange = e => setEntryUrl(e.target.value);
  const handleNotesChange = e => setNotes(e.target.value);

  const deriveStatus = rr => {
    if (rr >= 1) return 'Win';
    if (rr < 0) return 'Loss';
    return 'Breakeven';
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!currentUser?.id) {
      toast.error('Du musst eingeloggt sein, um einen Trade hinzuzufügen.');
      return;
    }

    if (!accountId) {
      toast.error('Ein Konto ist erforderlich. Bitte erstelle oder wähle zuerst ein Konto aus.');
      return;
    }

    if (!symbol.trim()) {
      toast.error('Symbol ist erforderlich.');
      return;
    }

    // Validate RR Secured
    if (rrSecured === null || rrSecured === undefined || String(rrSecured).trim() === '') {
      toast.error('Chance/Risiko-Verhältnis ist erforderlich.');
      return;
    }

    const normalizedRrSecured = String(rrSecured).replace(',', '.');
    const finalRrSecured = Number(normalizedRrSecured);

    if (isNaN(finalRrSecured)) {
      toast.error('Chance/Risiko-Verhältnis muss eine gültige Zahl sein.');
      return;
    }

    // Parse numbers strictly
    const parsedStopLoss = parseFloat(stopLoss);
    const parsedStopLossPips = stopLossPips ? parseFloat(stopLossPips) : null;
    const parsedCommission = parseFloat(commissionPercentage);

    if (isNaN(parsedStopLoss) || parsedStopLoss < 0) {
      toast.error('Stop Loss muss eine gültige positive Zahl sein.');
      return;
    }

    const stopLossVal = parsedStopLoss;
    const commissionVal = isNaN(parsedCommission) ? 0 : parsedCommission;

    if (stopLossVal > 100) {
      toast.error('Stop-Loss-Prozentwert darf 100% nicht überschreiten.');
      return;
    }

    setLoading(true);
    try {
      // Save the symbol to the user's symbols collection if it's new
      await addSymbol(symbol);

      const derivedStatus = status || deriveStatus(finalRrSecured);
      const monetaryStopLoss = calculateStopLossInEuro(startingBalance, stopLossVal);
      const profitLossVal = monetaryStopLoss * finalRrSecured;

      // Format date properly for PocketBase (YYYY-MM-DD HH:mm:ss.SSSZ)
      // Using 12:00:00 to avoid timezone shifting issues when parsing back
      const formattedDate = entryDate ? `${entryDate} 12:00:00.000Z` : null;

      const payload = {
        userId: currentUser.id,
        accountId: accountId,
        symbol: symbol.trim().toUpperCase(),
        entryDate: formattedDate,
        date: formattedDate, // Required by schema
        entryTime: entryTime,
        time: entryTime, // Required by schema
        stopLoss: stopLossVal,
        stopLossPips: parsedStopLossPips,
        rrSecured: finalRrSecured,
        riskRewardRatio: finalRrSecured,
        status: derivedStatus,
        commissionPercentage: commissionVal,
        profitLoss: profitLossVal,
        contextUrl: contextUrl.trim() || '',
        validationUrl: validationUrl.trim() || '',
        entryUrl: entryUrl.trim() || '',
        notes: notes.trim() || ''
      };

      await pb.collection('trades').create(payload, {
        $autoCancel: false
      });

      toast.success('Trade erfolgreich hinzugefügt.');

      // Reset form
      setSymbol('');
      setEntryDate('');
      setEntryTime('');
      setStopLoss('');
      setStopLossPips('');
      setRrSecured('');
      setStatus('');
      setCommissionPercentage(globalCommission.toString());
      setContextUrl('');
      setValidationUrl('');
      setEntryUrl('');
      setNotes('');
      setDuplicateWarning('');
      setIsMobileFormOpen(false);

      if (onTradeAdded) onTradeAdded();
    } catch (err) {
      console.error('PocketBase Error:', err);

      let errorMessage = 'Trade konnte nicht hinzugefügt werden. Bitte prüfe deine Eingaben.';

      if (err.response && err.response.data) {
        const validationErrors = Object.entries(err.response.data)
          .map(([field, errorObj]) => `${field}: ${errorObj.message}`)
          .join(' | ');

        if (validationErrors) {
          errorMessage = `Validierungsfehler: ${validationErrors}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, {
        duration: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-panel rounded-lg">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-kicker mb-2">Neue Ausführung</p>
            <CardTitle className="text-2xl font-black">Neuen Trade erfassen</CardTitle>
            <CardDescription>Erfasse Trade, Risiko und Review-Kontext in einem Ablauf</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 sm:hidden"
            onClick={() => setIsMobileFormOpen((value) => !value)}
            aria-expanded={isMobileFormOpen}
            aria-label={isMobileFormOpen ? 'Trade-Formular ausblenden' : 'Trade-Formular anzeigen'}
          >
            {isMobileFormOpen ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={`${isMobileFormOpen ? 'block' : 'hidden'} sm:block`}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {duplicateWarning && (
            <Alert variant="warning" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{duplicateWarning}</AlertDescription>
            </Alert>
          )}

          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountId" className="text-xs font-semibold uppercase text-muted-foreground">Konto *</Label>
              <Select value={accountId} onValueChange={setAccountId} required>
                <SelectTrigger id="accountId" className="border-white/10 bg-black/20">
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
              <Label htmlFor="symbol" className="text-xs font-semibold uppercase text-muted-foreground">Symbol *</Label>
              <SymbolCombobox
                value={symbol}
                onChange={setSymbol}
                symbols={symbols}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryDate" className="text-xs font-semibold uppercase text-muted-foreground">Einstiegsdatum *</Label>
              <Input
                id="entryDate"
                name="entryDate"
                type="date"
                value={entryDate}
                onChange={handleEntryDateChange}
                required
                className="border-white/10 bg-black/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryTime" className="text-xs font-semibold uppercase text-muted-foreground">Einstiegszeit *</Label>
              <Input
                id="entryTime"
                name="entryTime"
                type="time"
                value={entryTime}
                onChange={handleEntryTimeChange}
                required
                className="border-white/10 bg-black/20"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stopLoss" className="text-xs font-semibold uppercase text-muted-foreground">Stop Loss (%) *</Label>
              <Input
                id="stopLoss"
                name="stopLoss"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={stopLoss}
                onChange={handleStopLossChange}
                placeholder="z. B. 1.0"
                required
                className="border-white/10 bg-black/20"
              />
              {stopLoss && !isNaN(parseFloat(stopLoss)) && (
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  Stop Loss: {stopLoss}% von €{startingBalance.toLocaleString()} = €{calculateStopLossInEuro(startingBalance, stopLoss).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stopLossPips" className="text-xs font-semibold uppercase text-muted-foreground">Stop Loss (Pips)</Label>
              <Input
                id="stopLossPips"
                name="stopLossPips"
                type="number"
                step="0.1"
                min="0"
                value={stopLossPips}
                onChange={handleStopLossPipsChange}
                placeholder="z. B. 15.5"
                className="border-white/10 bg-black/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rrSecured" className="text-xs font-semibold uppercase text-primary">Chance/Risiko-Verhältnis *</Label>
              <Input
                id="rrSecured"
                name="rrSecured"
                type="text"
                inputMode="decimal"
                value={rrSecured}
                onChange={handleRrSecuredChange}
                placeholder="z. B. 2.5, -1, 0"
                required
                className="border-primary/40 bg-primary/10 focus-visible:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-semibold uppercase text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger id="status" className="border-white/10 bg-black/20">
                  <SelectValue placeholder="Automatisch berechnen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Win">Gewinn</SelectItem>
                  <SelectItem value="Loss">Verlust</SelectItem>
                  <SelectItem value="Breakeven">Break-even</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commissionPercentage" className="text-xs font-semibold uppercase text-muted-foreground">Gebühr (%)</Label>
              <Input
                id="commissionPercentage"
                name="commissionPercentage"
                type="number"
                step="0.001"
                min="0"
                value={commissionPercentage}
                onChange={handleCommissionChange}
                className="border-white/10 bg-black/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contextUrl" className="text-xs font-semibold uppercase text-muted-foreground">Kontext URL</Label>
              <Input
                id="contextUrl"
                name="contextUrl"
                type="url"
                value={contextUrl}
                onChange={handleContextUrlChange}
                placeholder="https://..."
                className="border-white/10 bg-black/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validationUrl" className="text-xs font-semibold uppercase text-muted-foreground">Validierungs URL</Label>
              <Input
                id="validationUrl"
                name="validationUrl"
                type="url"
                value={validationUrl}
                onChange={handleValidationUrlChange}
                placeholder="https://..."
                className="border-white/10 bg-black/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryUrl" className="text-xs font-semibold uppercase text-muted-foreground">Einstiegs URL</Label>
              <Input
                id="entryUrl"
                name="entryUrl"
                type="url"
                value={entryUrl}
                onChange={handleEntryUrlChange}
                placeholder="https://..."
                className="border-white/10 bg-black/20"
              />
            </div>
          </div>

          {/* Row 4 */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold uppercase text-muted-foreground">Notizen</Label>
            <Textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={handleNotesChange}
              placeholder="Trade-Setup, Marktbedingungen, Learnings..."
              rows={3}
              className="border-white/10 bg-black/20 resize-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full gap-2 bg-primary py-5 text-base font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.99]"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Trade wird gespeichert...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Trade ins Journal eintragen
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TradeEntryForm;
