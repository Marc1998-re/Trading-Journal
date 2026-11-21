import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Target, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { money, percent } from '@/lib/format';
import { Gauge } from './JournalUI';
import { accountTypeLabels, evaluateAccountRules, hasRules, usageTone } from '@/lib/accountRules';

function LimitMeter({ label, used, limit, left, detail, invert = false }) {
  const pct = limit ? Math.max(0, used) / limit * 100 : 0;
  const tone = invert ? (pct >= 100 ? 'success' : 'primary') : usageTone(pct);
  return <div className="grid gap-1.5">
    <div className="flex items-baseline justify-between gap-3 text-xs"><span className="text-muted-foreground">{label}</span><strong className="font-mono text-sm">{left}</strong></div>
    <Gauge value={Math.min(100, pct)} max={100} tone={tone} />
    <span className="text-[11px] text-muted-foreground">{detail}</span>
  </div>;
}

export function AccountRulesCard({ account, trades, settingsPath = '/settings' }) {
  const r = evaluateAccountRules(account, trades);
  const prop = account.accountType === 'prop';
  const breached = r.drawdown?.breached || (r.daily && r.daily.used >= r.daily.limit);
  return <section className="journal-panel rules-card">
    <header className="panel-header">
      <div className="min-w-0"><p className="panel-eyebrow">{accountTypeLabels[account.accountType] || accountTypeLabels.private}{account.propFirm ? ' · ' + account.propFirm : ''}</p><h2 className="truncate">{account.accountName}</h2></div>
      {breached ? <span className="status-pill bad"><AlertTriangle size={12} className="mr-1 inline" />Limit verletzt</span> : r.target?.reached ? <span className="status-pill ok"><CheckCircle2 size={12} className="mr-1 inline" />Ziel erreicht</span> : <span className="status-pill neutral">Im Rahmen</span>}
    </header>
    <div className="rules-body grid gap-4">
      {r.daily && <LimitMeter label="Tagesverlust heute" used={r.daily.used} limit={r.daily.limit} left={`${money(r.daily.remaining)} frei`} detail={`Limit ${money(r.daily.limit)} · heute ${money(r.daily.today, true)} · schlechtester Tag ${money(r.daily.worst, true)}${r.daily.breaches ? ` · ${r.daily.breaches}× überschritten` : ''}`} />}
      {r.drawdown && <LimitMeter label={r.trailing ? 'Max. Verlust (trailing)' : 'Max. Verlust (statisch)'} used={r.drawdown.used} limit={r.drawdown.limit} left={`${money(r.drawdown.distance)} Puffer`} detail={`Untergrenze ${money(r.drawdown.floor)} · Kontostand ${money(r.balance)} · knappster Abstand ${money(r.drawdown.closest)}`} />}
      {r.target && <LimitMeter invert label={<span className="inline-flex items-center gap-1"><Target size={12} />Gewinnziel</span>} used={r.profit} limit={r.target.goal} left={percent(Math.max(0, r.target.progress), { digits: 0 })} detail={r.target.reached ? `${money(r.profit, true)} von ${money(r.target.goal)} – erreicht` : `${money(r.profit, true)} von ${money(r.target.goal)} · noch ${money(r.target.remaining)}`} />}
      {r.risk && <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs"><span className="text-muted-foreground">Risiko je Trade ≤ {percent(r.risk.limit)}</span><strong className={r.risk.breaches ? 'text-destructive' : 'text-success'}>{r.risk.breaches ? `${r.risk.breaches} von ${r.risk.trades} Trades darüber` : 'Immer eingehalten'}</strong></div>}
      {r.activity && <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs"><span className="text-muted-foreground">Max. {r.activity.limit} Trades pro Tag</span><strong className={r.activity.breaches ? 'text-destructive' : 'text-success'}>{r.activity.breaches ? `${r.activity.breaches} Tage überschritten` : `Heute ${r.activity.today} / ${r.activity.limit}`}</strong></div>}
    </div>
    <p className="mt-4 text-[11px] leading-4 text-muted-foreground">{prop ? 'Basis: realisierte, erfasste Trades. Floating-Verluste offener Positionen zählen bei Prop-Firms oft mit, sind hier aber nicht enthalten.' : 'Eigene Limits schützen dein Kapital. Basis: realisierte Trades.'} <Link to={settingsPath} className="text-primary hover:underline">Regeln ändern</Link></p>
  </section>;
}

export function RulesPrompt({ settingsPath = '/settings' }) {
  return <section className="journal-panel flex flex-col items-start gap-3">
    <p className="panel-eyebrow">Kontoregeln</p>
    <h2 className="text-lg font-medium">Limits im Blick behalten</h2>
    <p className="text-sm leading-6 text-muted-foreground">Hinterlege Tagesverlust-Limit, maximalen Drawdown und Gewinnziel deiner Prop-Firm-Challenge – oder eigene Limits für dein Privatkapital. Das Journal zeigt dir dann jederzeit deinen Puffer.</p>
    <Button asChild variant="outline" size="sm"><Link to={settingsPath}><Settings2 size={15} className="mr-2" />Regeln festlegen</Link></Button>
  </section>;
}

const numberOrNull = value => value === '' || value === null || value === undefined ? null : Number(value);

export function AccountRulesForm({ account, onSave }) {
  const start = Number(account.startingBalance) || 0;
  const [form, setForm] = useState({
    accountType: account.accountType || 'private', propFirm: account.propFirm || '', startingBalance: account.startingBalance ?? '',
    dailyLossLimit: account.dailyLossLimit ?? '', maxLoss: account.maxLoss ?? '', drawdownMode: account.drawdownMode || 'static',
    profitTarget: account.profitTarget ?? '', maxRiskPerTrade: account.maxRiskPerTrade ?? '', maxTradesPerDay: account.maxTradesPerDay ?? '',
  });
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const prop = form.accountType === 'prop';
  const pctHint = key => Number(form[key]) > 0 && start > 0 ? `${percent(Number(form[key]) / start * 100)} des Startkapitals` : ' ';
  const preset = (daily, max, target, mode) => setForm(f => ({ ...f, dailyLossLimit: daily ? Math.round(start * daily / 100) : '', maxLoss: max ? Math.round(start * max / 100) : '', profitTarget: target ? Math.round(start * target / 100) : '', drawdownMode: mode }));
  async function submit(e) {
    e.preventDefault(); setBusy(true);
    try {
      await onSave(account.id, {
        accountType: form.accountType, propFirm: prop ? form.propFirm.trim() : '', startingBalance: Number(form.startingBalance),
        dailyLossLimit: numberOrNull(form.dailyLossLimit), maxLoss: numberOrNull(form.maxLoss), drawdownMode: form.drawdownMode,
        profitTarget: numberOrNull(form.profitTarget), maxRiskPerTrade: numberOrNull(form.maxRiskPerTrade), maxTradesPerDay: numberOrNull(form.maxTradesPerDay),
      });
    } finally { setBusy(false); }
  }
  const field = (key, label, props = {}, hint) => <label className="form-field">{label}<Input value={form[key]} onChange={e => set(key, e.target.value)} {...props} />{hint !== undefined && <span className="min-h-4 font-normal">{hint}</span>}</label>;
  return <form onSubmit={submit} className="form-section space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-sm">{account.accountName}</strong>
      <div className="chip-group" role="group" aria-label="Kontotyp">{[['private', 'Privatkapital'], ['prop', 'Prop-Firm']].map(([key, label]) => <button key={key} type="button" aria-pressed={form.accountType === key} onClick={() => set('accountType', key)}>{label}</button>)}</div>
    </div>
    <div className="field-grid">
      {prop && field('propFirm', 'Prop-Firm / Programm', { maxLength: 80, placeholder: 'z. B. FTMO 100k Phase 1' })}
      {field('startingBalance', 'Startkapital (€)', { type: 'number', min: 1, step: 'any', required: true })}
    </div>
    {prop && <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>Vorlage:</span>
      <div className="chip-group">{[['Challenge 5 % / 10 % / 10 %', 5, 10, 10, 'static'], ['Verifizierung 5 % / 10 % / 5 %', 5, 10, 5, 'static'], ['Funded 5 % / 10 %', 5, 10, null, 'static'], ['Trailing 4 % / 6 % / 8 %', 4, 6, 8, 'trailing']].map(([label, d, m, t, mode]) => <button key={label} type="button" aria-pressed={false} onClick={() => preset(d, m, t, mode)}>{label}</button>)}</div>
      <span>Bitte mit den Regeln deiner Firma abgleichen.</span></div>}
    <div className="field-grid">
      {field('dailyLossLimit', prop ? 'Tagesverlust-Limit (€)' : 'Eigenes Tagesverlust-Limit (€)', { type: 'number', min: 0, step: 'any' }, pctHint('dailyLossLimit'))}
      {field('maxLoss', prop ? 'Max. Verlust / Drawdown (€)' : 'Max. Drawdown, bevor ich pausiere (€)', { type: 'number', min: 0, step: 'any' }, pctHint('maxLoss'))}
      <div className="form-field"><span>Drawdown-Art</span><div className="chip-group">{[['static', 'Statisch (vom Startkapital)'], ['trailing', 'Trailing (vom Höchststand)']].map(([key, label]) => <button key={key} type="button" aria-pressed={form.drawdownMode === key} onClick={() => set('drawdownMode', key)}>{label}</button>)}</div></div>
      {field('profitTarget', prop ? 'Gewinnziel (€)' : 'Gewinnziel (€, optional)', { type: 'number', min: 0, step: 'any' }, pctHint('profitTarget'))}
      {field('maxRiskPerTrade', 'Max. Risiko je Trade (% vom Startkapital)', { type: 'number', min: 0, max: 100, step: 'any', placeholder: 'z. B. 1' })}
      {field('maxTradesPerDay', 'Max. Trades pro Tag', { type: 'number', min: 1, max: 255, step: 1, placeholder: 'z. B. 3' })}
    </div>
    <div className="flex justify-end"><Button disabled={busy}>{busy ? 'Wird gespeichert…' : 'Kontoregeln speichern'}</Button></div>
  </form>;
}
