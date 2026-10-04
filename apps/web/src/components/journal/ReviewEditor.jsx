import React, { useCallback, useState } from 'react';
import { CheckCircle2, Save, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUnsavedReview } from '@/contexts/NavigationGuardContext';
import { getTradeNetProfit, getTradeRiskBasis } from '@/lib/tradeCalculations';
import RiskBasisLabel from './RiskBasisLabel';
import MetricHelp from './MetricHelp';
import { reviewForm, reviewPayload, reviewStatus, reviewStatusLabels, reviewTags } from '@/lib/review';
import { money, rValue } from '@/lib/format';
import pb from '@/lib/pocketbaseClient';

export default function ReviewEditor({ trade, data }) {
  const [form, setForm] = useState(() => reviewForm(trade));
  const [saved, setSaved] = useState(() => reviewForm(trade));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const discard = useCallback(() => { setForm(saved); setError(''); }, [saved]);
  useUnsavedReview(dirty, busy, discard);
  const status = reviewStatus(trade);
  const set = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const net = getTradeNetProfit(trade, data.balances, data.balances);
  const { amount: risk, source: riskSource } = getTradeRiskBasis(trade, data.balances, data.balances);

  async function save(nextStatus) {
    if (busy) return;
    setError('');
    let payload;
    try { payload = reviewPayload(form, nextStatus); } catch (e) { setError(e.message); return; }
    setBusy(true);
    try {
      const record = data.demo ? { ...trade, ...payload, reviewCompletedAt: nextStatus === 'completed' ? trade.reviewCompletedAt || new Date().toISOString() : '' } : await pb.collection('trades').update(trade.id, payload);
      // Older servers may silently ignore fields before the migration is installed.
      if (record.reviewStatus !== nextStatus || JSON.stringify(reviewForm(record)) !== JSON.stringify(reviewForm(payload))) {
        throw new Error('Die Review-Felder wurden vom Server nicht vollständig bestätigt. Bitte die Datenbank-Aktualisierung prüfen. Dein Entwurf bleibt hier erhalten.');
      }
      setForm(reviewForm(record)); setSaved(reviewForm(record));
      data.updateTrade(record);
      toast.success(data.demo ? 'Demo-Review gespeichert. Nur für diese Sitzung.' : nextStatus === 'completed' ? 'Review abgeschlossen.' : 'Entwurf gespeichert.');
    } catch (e) {
      setError(e.message?.startsWith('Die Review-Felder') ? e.message : 'Der Review konnte nicht gespeichert werden. Dein Entwurf bleibt erhalten.');
    } finally { setBusy(false); }
  }

  const check = (key, label) => <label className="form-field">{label}<select className="h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm" value={form[key]} onChange={e => set(key, e.target.value)} disabled={busy}>
    <option value="">Nicht bewertet</option><option value="yes">Ja</option><option value="no">Nein</option><option value="na">Nicht anwendbar</option>
  </select></label>;

  return <>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
      <span className="font-medium text-primary">{reviewStatusLabels[status]}</span>
      {trade.reviewCompletedAt && status === 'completed' && <span className="text-muted-foreground">Abgeschlossen am {new Date(trade.reviewCompletedAt).toLocaleDateString('de-DE')}</span>}
    </div>
    {data.demo && <p className="mb-4 border-l-2 border-primary pl-3 text-xs text-muted-foreground">Fiktiver Trade. Änderungen gelten nur für diese Demo-Sitzung und werden beim Neuladen oder Verlassen der Demo zurückgesetzt.</p>}
    <div className="trade-preview">
      <div><span className="flex min-h-8 items-center">Netto</span><strong>{money(net, true)}</strong></div>
      <div><span className="flex min-h-8 items-center">Geldrisiko als R-Basis</span><strong>{money(risk)}</strong><RiskBasisLabel source={riskSource}/></div>
      <div><span className="flex items-center gap-1">Netto-R<MetricHelp helpKey="netR" /></span><strong>{risk ? rValue(net / risk) : '—'}</strong></div>
    </div>
    <div className="my-6 grid gap-4 sm:grid-cols-2">{check('reviewSetup', 'Setup eingehalten?')}{check('reviewRisk', 'Geplantes Risiko eingehalten?')}</div>
    <fieldset disabled={busy} className="mb-6"><legend className="text-sm font-medium mb-3">Lern-Tags <span className="font-normal text-muted-foreground">· optional</span></legend>
      <div className="grid gap-3 sm:grid-cols-2">{reviewTags.map(([id, label]) => <label key={id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary h-4 w-4" checked={form.reviewTags.includes(id)} onChange={e => set('reviewTags', (e.target.checked ? [...form.reviewTags, id] : form.reviewTags.filter(tag => tag !== id)).sort())} />{label}</label>)}</div>
    </fieldset>
    <label className="form-field mb-4">Dein Rückblick
      <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={4} maxLength={5000} disabled={busy} placeholder="Plan, Ausführung und eine konkrete Erkenntnis für den nächsten Trade." />
    </label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="form-field">Meine Erkenntnis<Textarea value={form.reviewLesson} onChange={e => set('reviewLesson', e.target.value)} rows={4} maxLength={1000} disabled={busy} placeholder="Was habe ich aus diesem Trade gelernt?" /></label>
      <label className="form-field">Mein nächster Schritt<Textarea value={form.reviewAction} onChange={e => set('reviewAction', e.target.value)} rows={4} maxLength={1000} disabled={busy} placeholder="Was werde ich beim nächsten Trade konkret tun?" /></label>
    </div>
    <div className="mt-5 flex flex-wrap gap-3 items-center justify-between">
      <span role="status" className="text-xs text-muted-foreground">{busy ? 'Wird gespeichert…' : dirty ? 'Ungespeicherte Änderungen' : 'Keine ungespeicherten Änderungen'}</span>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy || (!dirty && status !== 'completed')} onClick={() => save('draft')}>{status === 'completed' && !dirty ? <Undo2 size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}{status === 'completed' && !dirty ? 'Wieder öffnen' : 'Entwurf speichern'}</Button>
        <Button disabled={busy || (!dirty && status === 'completed')} onClick={() => save('completed')}><CheckCircle2 size={16} className="mr-2" />Review abschließen</Button>
      </div>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </>;
}
