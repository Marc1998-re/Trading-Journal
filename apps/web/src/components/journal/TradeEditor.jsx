import React, { useState } from 'react';
import { ChevronDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { money, rValue } from '@/lib/format';
import { dayKey, getTradeRiskBasis } from '@/lib/tradeCalculations';
import { riskSources } from '@/lib/riskAnalysis';
import { emotionOptions, gradeOptions, holdingMinutes, formatDuration } from '@/lib/proJournal';

const optionalNumber = value => value === '' || value === null || value === undefined ? null : Number(value);
const hasProFields = trade => Boolean(trade && (trade.exitDate || trade.plannedRR != null || trade.mae != null || trade.mfe != null || trade.grade || trade.emotion || trade.confidence));

export default function TradeEditor({ trade, accounts, onClose, onSaved, setupSuggestions = [] }) {
  const { currentUser } = useAuth();
  const balances = Object.fromEntries(accounts.map(a => [a.id, a.startingBalance]));
  const riskBasis = getTradeRiskBasis(trade, balances, balances);
  const [form, setForm] = useState({
    accountId: trade?.accountId || accounts[0]?.id || '', symbol: trade?.symbol || '',
    entryDate: trade?.entryDate?.slice(0, 10) || dayKey(new Date()), entryTime: trade?.entryTime || '12:00',
    exitDate: trade?.exitDate?.slice(0, 10) || '', exitTime: trade?.exitTime || '',
    setup: trade?.setup || '', side: (trade?.side || '').toLowerCase(),
    riskAmount: riskBasis.source === 'stored' ? riskBasis.amount : '', profitLoss: trade?.profitLoss ?? '',
    fees: trade?.fees ?? 0, commissionPercentage: trade?.commissionPercentage ?? 0,
    plannedRR: trade?.plannedRR ?? '', mae: trade?.mae ?? '', mfe: trade?.mfe ?? '',
    grade: trade?.grade || '', emotion: trade?.emotion || '', confidence: trade?.confidence ?? '',
    notes: trade?.notes || '', contextUrl: trade?.contextUrl || '',
  });
  const [showPro, setShowPro] = useState(() => hasProFields(trade));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const gross = Number(form.profitLoss) || 0, risk = Number(form.riskAmount) || 0;
  const net = gross - Number(form.fees) - Math.max(0, gross) * Number(form.commissionPercentage) / 100;
  const hold = holdingMinutes(form);
  const field = (key, label, props = {}) => <label className="form-field">{label}<Input value={form[key]} onChange={e => set(key, e.target.value)} {...props} /></label>;
  const choice = (key, options, label) => <div className="form-field"><span>{label}</span><div className="chip-group" role="group" aria-label={label}>{options.map(([value, text]) => <button type="button" key={value} aria-pressed={String(form[key]) === String(value)} onClick={() => set(key, String(form[key]) === String(value) ? '' : value)}>{text}</button>)}</div></div>;

  async function save(e) {
    e.preventDefault(); setError('');
    if (!Number.isFinite(risk) || risk <= 0 || !form.accountId || !Number.isFinite(net)) return setError('Bitte wähle ein Konto und erfasse gültige Werte. Das ursprüngliche Risiko muss größer als null sein.');
    if (form.exitDate && (form.exitDate < form.entryDate || (form.exitDate === form.entryDate && form.exitTime && form.exitTime < form.entryTime))) return setError('Der Ausstieg darf nicht vor dem Einstieg liegen.');
    if (form.exitTime && !form.exitDate) return setError('Bitte erfasse zur Ausstiegszeit auch das Ausstiegsdatum.');
    setBusy(true);
    try {
      const account = accounts.find(a => a.id === form.accountId);
      const payload = {
        ...form, userId: currentUser.id, symbol: form.symbol.trim().toUpperCase(), setup: form.setup.trim(),
        riskAmount: risk, profitLoss: gross, fees: Number(form.fees), commissionPercentage: Number(form.commissionPercentage),
        exitDate: form.exitDate || null, exitTime: form.exitDate ? form.exitTime : '',
        plannedRR: optionalNumber(form.plannedRR), mae: optionalNumber(form.mae), mfe: optionalNumber(form.mfe), confidence: optionalNumber(form.confidence),
        rrSecured: gross / risk, stopLoss: trade?.stopLoss || ((risk / Number(account?.startingBalance)) * 100) || 0,
        date: form.entryDate, status: net > 0 ? 'Win' : net < 0 ? 'Loss' : 'Breakeven',
      };
      if (trade) await pb.collection('trades').update(trade.id, payload); else await pb.collection('trades').create(payload);
      await onSaved(); onClose();
    } catch (e) { setError(e.response?.message || 'Der Trade konnte nicht gespeichert werden. Bitte erneut versuchen.'); } finally { setBusy(false); }
  }

  return <Dialog open onOpenChange={open => !open && !busy && onClose()}><DialogContent className="max-w-3xl max-h-[92dvh] overflow-y-auto">
    <DialogTitle>{trade ? 'Trade bearbeiten' : 'Abgeschlossenen Trade erfassen'}</DialogTitle>
    <DialogDescription>EUR · Risiko bei Eröffnung · tatsächlich realisiertes Ergebnis. Pflichtfelder reichen für alle Kernkennzahlen; Profi-Angaben schalten zusätzliche Auswertungen frei.</DialogDescription>
    <form onSubmit={save} className="space-y-4">
      <fieldset className="form-section"><legend>1 · Trade</legend><div className="field-grid">
        <label className="form-field">Konto<select required className="h-10 rounded-md border bg-background px-3" value={form.accountId} onChange={e => set('accountId', e.target.value)}><option value="">Konto auswählen</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.accountName}</option>)}</select></label>
        {field('symbol', 'Symbol', { required: true, maxLength: 30, placeholder: 'EUR/USD' })}
        {field('setup', 'Setup', { maxLength: 80, placeholder: 'z. B. London Breakout', list: 'setup-suggestions' })}
        {choice('side', [['long', 'Long'], ['short', 'Short']], 'Richtung')}
        {field('entryDate', 'Einstiegsdatum', { type: 'date', required: true })}
        {field('entryTime', 'Einstiegszeit', { type: 'time', required: true })}
      </div><datalist id="setup-suggestions">{setupSuggestions.map(name => <option key={name} value={name} />)}</datalist></fieldset>

      <fieldset className="form-section"><legend>2 · Risiko & Ergebnis</legend><div className="field-grid">
        {field('riskAmount', 'Ursprüngliches Risiko (€) = 1 R', { type: 'number', min: 0.01, step: 'any', required: true })}
        {field('profitLoss', 'Realisiertes Brutto-Ergebnis (€)', { type: 'number', step: 'any', required: true })}
        {field('fees', 'Ordergebühren & Swap (€)', { type: 'number', min: 0, step: 'any', required: true })}
        {field('commissionPercentage', 'Gewinnbeteiligung (%)', { type: 'number', min: 0, max: 100, step: 'any' })}
      </div>
        {trade && riskBasis.source !== 'stored' && <p className="mt-3 border-l-2 border-info pl-3 text-xs leading-5 text-muted-foreground">Bisherige Risikobasis: {riskSources[riskBasis.source].label}{riskBasis.amount !== null ? ` (${money(riskBasis.amount)})` : ''}. Bitte erfasse vor dem Speichern das tatsächliche ursprüngliche Geldrisiko.</p>}
        <div className="trade-preview mt-4"><div><span>Netto-Ergebnis</span><strong className={net > 0 ? 'text-success' : net < 0 ? 'text-destructive' : ''}>{money(net, true)}</strong></div><div><span>Risiko</span><strong>{risk > 0 ? money(risk) : '—'}</strong></div><div><span>Netto-R</span><strong>{risk > 0 ? rValue(net / risk) : '—'}</strong></div></div>
      </fieldset>

      <button type="button" className="flex w-full items-center justify-between rounded-lg border border-dashed px-4 py-3 text-left text-sm hover:border-primary/60" aria-expanded={showPro} onClick={() => setShowPro(v => !v)}>
        <span><strong className="block font-medium">Profi-Angaben</strong><span className="text-xs text-muted-foreground">Ausstieg, Planung, MAE/MFE, Setup-Qualität und Psychologie · optional</span></span>
        <ChevronDown size={18} className={`transition-transform ${showPro ? 'rotate-180' : ''}`} />
      </button>
      {showPro && <>
        <fieldset className="form-section"><legend>3 · Ausführung</legend><div className="field-grid">
          {field('exitDate', 'Ausstiegsdatum', { type: 'date', min: form.entryDate })}
          {field('exitTime', 'Ausstiegszeit', { type: 'time' })}
          {field('plannedRR', 'Geplantes Ziel (R)', { type: 'number', min: 0, step: 'any', placeholder: 'z. B. 2,5' })}
          <div className="form-field"><span>Haltedauer</span><div className="flex h-10 items-center font-mono text-sm text-foreground">{formatDuration(hold)}</div></div>
          {field('mfe', 'MFE – max. im Plus (R)', { type: 'number', min: 0, step: 'any', placeholder: 'z. B. 3,2' })}
          {field('mae', 'MAE – max. im Minus (R)', { type: 'number', min: 0, step: 'any', placeholder: 'z. B. 0,4' })}
        </div><p className="mt-3 text-xs leading-5 text-muted-foreground">MFE/MAE: Wie weit lief der Kurs während des Trades höchstens für bzw. gegen dich, gemessen in R? Beides als positive Zahl eintragen.</p></fieldset>
        <fieldset className="form-section"><legend>4 · Qualität & Psychologie</legend><div className="grid gap-4">
          {choice('grade', gradeOptions, 'Setup-Qualität vor dem Einstieg')}
          {choice('emotion', emotionOptions.map(([k, l]) => [k, l.split(' / ')[0]]), 'Emotion beim Einstieg')}
          {choice('confidence', [1, 2, 3, 4, 5].map(n => [String(n), n === 1 ? '1 · unsicher' : n === 5 ? '5 · sehr sicher' : String(n)]), 'Überzeugung')}
        </div></fieldset>
      </>}

      <fieldset className="form-section"><legend>Dokumentation</legend><div className="grid gap-4">
        {field('contextUrl', 'Chart-Link (TradingView-Screenshot o. Ä.)', { type: 'url', placeholder: 'https://…' })}
        <label className="form-field">Notiz<Textarea value={form.notes} maxLength={5000} rows={3} onChange={e => set('notes', e.target.value)} placeholder="Was war geplant? Was ist passiert? Was nehme ich mit?" /></label>
      </div></fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Abbrechen</Button><Button disabled={busy || !accounts.length}><Save size={16} className="mr-2" />{busy ? 'Wird gespeichert…' : 'Trade speichern'}</Button></div>
    </form>
  </DialogContent></Dialog>;
}
