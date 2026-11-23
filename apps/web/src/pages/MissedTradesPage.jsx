import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Plus, Pencil, Trash2, Save, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useJournalData } from '@/hooks/useJournalData';
import { PageHeading, PeriodToolbar, DataState, IconButton, KpiCard, SectionTitle, SplitBar, Panel, toneOf } from '@/components/journal/JournalUI';
import { getTradeDate, dayKey } from '@/lib/tradeCalculations';
import { rValue, percent, decimal } from '@/lib/format';
import { missedReasonOptions, missedReasonLabels, decisionLabels, disciplinedReasons, gradeOptions, sideLabel, summarizeMissedTrades } from '@/lib/proJournal';
import { useAuth } from '@/contexts/AuthContext';
import ChartStrip, { ChartLinks } from '@/components/journal/ChartStrip';
import { chartFields } from '@/lib/screenshots';
import pb from '@/lib/pocketbaseClient';

function MissedEditor({ entry, accounts, setups, onClose, onSaved }) {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    accountId: entry?.accountId || accounts[0]?.id || '', symbol: entry?.symbol || '',
    entryDate: entry?.entryDate?.slice(0, 10) || dayKey(new Date()), entryTime: entry?.entryTime || '12:00',
    setup: entry?.setup || '', side: entry?.side || '', grade: entry?.grade || '',
    decision: entry?.decision || 'missed', reason: entry?.reason || 'hesitation',
    potentialR: entry?.potentialR ?? '', notes: entry?.notes || '', contextUrl: entry?.contextUrl || '',
    validationUrl: entry?.validationUrl || '', entryUrl: entry?.entryUrl || '',
  });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const chips = (key, options, label) => <div className="form-field"><span>{label}</span><div className="chip-group" role="group" aria-label={label}>{options.map(([value, text]) => <button type="button" key={value} aria-pressed={form[key] === value} onClick={() => set(key, value)}>{text}</button>)}</div></div>;
  const pickReason = reason => setForm(f => ({ ...f, reason, decision: disciplinedReasons.has(reason) ? 'valid' : 'missed' }));
  async function save(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const payload = { ...form, userId: currentUser.id, symbol: form.symbol.trim().toUpperCase(), setup: form.setup.trim(), potentialR: form.potentialR === '' ? null : Number(form.potentialR) };
      if (entry) await pb.collection('missedTrades').update(entry.id, payload); else await pb.collection('missedTrades').create(payload);
      await onSaved(); onClose();
    } catch (err) { setError(err.response?.message || 'Der Eintrag konnte nicht gespeichert werden.'); } finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open => !open && !busy && onClose()}><DialogContent className="max-w-2xl max-h-[92dvh] overflow-y-auto">
    <DialogTitle>{entry ? 'Nicht genommenen Trade bearbeiten' : 'Nicht genommenen Trade erfassen'}</DialogTitle>
    <DialogDescription>Halte Setups fest, die du gesehen, aber nicht gehandelt hast, und warum. So erkennst du Zögern genauso wie gute, regelkonforme Entscheidungen.</DialogDescription>
    <form onSubmit={save} className="space-y-4">
      <fieldset className="form-section"><legend>Setup</legend><div className="field-grid">
        <label className="form-field">Konto<select required className="h-10 rounded-md border bg-background px-3" value={form.accountId} onChange={e => set('accountId', e.target.value)}>{accounts.map(a => <option key={a.id} value={a.id}>{a.accountName}</option>)}</select></label>
        <label className="form-field">Symbol<Input required maxLength={30} placeholder="NAS100" value={form.symbol} onChange={e => set('symbol', e.target.value)} /></label>
        <label className="form-field">Setup<Input maxLength={80} list="missed-setups" value={form.setup} onChange={e => set('setup', e.target.value)} /><datalist id="missed-setups">{setups.map(s => <option key={s} value={s} />)}</datalist></label>
        {chips('side', [['long', 'Long'], ['short', 'Short']], 'Richtung')}
        <label className="form-field">Datum<Input type="date" required value={form.entryDate} onChange={e => set('entryDate', e.target.value)} /></label>
        <label className="form-field">Uhrzeit<Input type="time" required value={form.entryTime} onChange={e => set('entryTime', e.target.value)} /></label>
      </div><div className="mt-4">{chips('grade', gradeOptions.map(([k, l]) => [k, l.split(' – ')[0] + '-Setup']), 'Qualität')}</div></fieldset>
      <fieldset className="form-section"><legend>Warum nicht genommen?</legend><div className="grid gap-4">
        <div className="form-field"><span>Grund</span><div className="chip-group" role="group" aria-label="Grund">{missedReasonOptions.map(([value, text]) => <button type="button" key={value} aria-pressed={form.reason === value} onClick={() => pickReason(value)}>{text}</button>)}</div></div>
        {chips('decision', [['valid', 'Richtig: bewusst & regelkonform ausgelassen'], ['missed', 'Fehler: hätte ich nehmen sollen']], 'Bewertung')}
        <label className="form-field max-w-xs">Hypothetisches Ergebnis (R)<Input type="number" step="any" placeholder="z. B. 2,5 oder −1" value={form.potentialR} onChange={e => set('potentialR', e.target.value)} /><span className="font-normal">Was hätte der Trade nach deinem Plan gebracht? Leer lassen, wenn unklar.</span></label>
      </div></fieldset>
      <fieldset className="form-section"><legend>Dokumentation</legend><div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">{chartFields.map(([key, label, hint]) => <label key={key} className="form-field">{label === 'Validierung' ? 'Validierungs' : label === 'Einstieg' ? 'Einstiegs' : label}-Link<Input type="url" value={form[key]} onChange={e => set(key, e.target.value.trim())} placeholder="https://www.tradingview.com/x/…" aria-describedby={'missed-' + key + '-hint'} /><span id={'missed-' + key + '-hint'} className="font-normal">{hint}</span></label>)}</div>
        <ChartStrip trade={form} />
        <label className="form-field">Notiz<Textarea rows={3} maxLength={5000} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Was hast du gesehen? Was hat dich abgehalten?" /></label>
      </div></fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Abbrechen</Button><Button disabled={busy}><Save size={16} className="mr-2" />{busy ? 'Wird gespeichert…' : 'Speichern'}</Button></div>
    </form>
  </DialogContent></Dialog>;
}

export default function MissedTradesPage() {
  const data = useJournalData();
  const [editor, setEditor] = useState(null), [deleting, setDeleting] = useState(null), [busy, setBusy] = useState(false), [filter, setFilter] = useState('all');
  const summary = useMemo(() => summarizeMissedTrades(data.missed), [data.missed]);
  const setups = useMemo(() => [...new Set([...data.allTrades, ...data.allMissed].map(t => t.setup).filter(Boolean))].sort(), [data.allTrades, data.allMissed]);
  const rows = data.missed.filter(m => filter === 'all' || (filter === 'valid' ? m.decision === 'valid' : m.decision !== 'valid')).sort((a, b) => getTradeDate(b) - getTradeDate(a));
  const maxReason = Math.max(1, ...summary.reasons.map(r => r.count));
  async function remove() { setBusy(true); try { await pb.collection('missedTrades').delete(deleting.id); await data.refresh(); setDeleting(null); } finally { setBusy(false); } }

  return <div className="journal-page">
    <Helmet><title>Nicht genommen · The Trading Desk</title></Helmet>
    <PageHeading eyebrow="Disziplin & Chancen" title="Nicht genommene Trades" action={data.demo ? <Button asChild><Link to="/signup">Eigenes Journal starten</Link></Button> : <Button onClick={() => setEditor({})} disabled={!data.accounts.length}><Plus size={16} className="mr-2" />Setup erfassen</Button>}>Jedes gesehene Setup zählt, auch das, das du nicht gehandelt hast.</PageHeading>
    <PeriodToolbar data={data} /><DataState data={data} />
    {data.missedError && <div role="alert" className="data-state border-accent/40">{data.missedError}</div>}

    <div className="kpi-grid kpi-grid-4">
      <KpiCard label="Nicht genommen" helpKey="skipDiscipline" value={summary.total} detail={`${summary.missed} verpasst · ${summary.valid} bewusst ausgelassen`}
        visual={summary.total > 0 && <SplitBar parts={[{ value: summary.valid, className: 'bg-success' }, { value: summary.missed, className: 'bg-warning' }]} />} />
      <KpiCard label="Bewusst ausgelassen" value={summary.disciplineRate === null ? '—' : percent(summary.disciplineRate, { digits: 0 })} tone={summary.disciplineRate >= 50 ? 'positive' : summary.disciplineRate !== null ? 'negative' : undefined} detail="Anteil regelkonformer Entscheidungen" />
      <KpiCard label="Verpasste Chance" value={summary.opportunityCount ? rValue(summary.opportunityR) : '—'} tone={summary.opportunityR > 0 ? 'negative' : undefined} detail={`${summary.opportunityCount} verpasste Setups mit Schätzung`} />
      <KpiCard label="Vermiedener Verlust" helpKey="skipDiscipline" value={summary.avoidedR ? rValue(summary.avoidedR) : '—'} tone={summary.avoidedR > 0 ? 'positive' : undefined} detail={summary.validWouldWinR ? `Ausgelassene Gewinner: ${rValue(summary.validWouldWinR)}` : 'Durch regelkonformes Auslassen'} />
    </div>

    <div className="cockpit-grid missed-grid mb-8">
      <Panel eyebrow="Ursachen" title="Warum nicht genommen?">
        {summary.reasons.length ? summary.reasons.map(r => <div key={r.key} className="reason-row">
          <span className="flex min-w-0 items-center gap-2"><i className={`h-2 w-2 shrink-0 rounded-full ${disciplinedReasons.has(r.key) ? 'bg-success' : 'bg-warning'}`} />{r.label}</span>
          <span className="gauge"><i className={disciplinedReasons.has(r.key) ? 'bg-success' : 'bg-warning'} style={{ width: `${r.count / maxReason * 100}%` }} /></span>
          <span className="text-right font-mono text-xs">{r.count}×{r.rCount ? <span className="block text-muted-foreground">{rValue(r.totalR)}</span> : null}</span>
        </div>) : <p className="py-6 text-sm text-muted-foreground">Noch keine Einträge in diesem Zeitraum.</p>}
        <p className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-success" />Meist regelkonform</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-warning" />Meist vermeidbar</span></p>
      </Panel>
      <Panel eyebrow="Muster" title="Nach Setup">
        {summary.setups.length ? <dl className="space-y-3">{summary.setups.map(s => <div key={s.key} className="flex items-center justify-between gap-3 border-b pb-3 text-sm"><dt className="min-w-0 truncate">{s.key}</dt><dd className="shrink-0 text-right font-mono text-xs">{s.count}× · {s.missed} verpasst{s.missed ? <span className={`block ${s.totalR > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{rValue(s.totalR)} liegengelassen</span> : null}</dd></div>)}</dl> : <p className="py-6 text-sm text-muted-foreground">—</p>}
      </Panel>
    </div>

    <SectionTitle number="01" title="Log">
      <div className="period-switch" role="group" aria-label="Bewertung filtern">{[['all', 'Alle'], ['missed', 'Verpasst'], ['valid', 'Bewusst ausgelassen']].map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div>
    </SectionTitle>
    <div className="journal-table-wrap" role="region" aria-label="Nicht genommene Trades" tabIndex={0}><table className="journal-table">
      <thead><tr>{['Setup', 'Grund', 'Bewertung', 'Hypothetisch', 'Charts', 'Notiz', ''].map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
      <tbody>{rows.map(m => <tr key={m.id}>
        <td className="min-w-44"><strong className="flex items-center gap-2">{m.symbol}{sideLabel(m.side) !== '—' && <span className={'side-badge ' + sideLabel(m.side).toLowerCase()}>{sideLabel(m.side)}</span>}{m.grade && <span className={'grade-badge grade-' + m.grade}>{m.grade}</span>}</strong><span className="sub">{getTradeDate(m)?.toLocaleDateString('de-DE')} · {m.entryTime} · {m.setup || 'Ohne Setup'}</span></td>
        <td className="min-w-44 text-sm">{missedReasonLabels[m.reason] || '—'}</td>
        <td><span className={m.decision === 'valid' ? 'status-pill ok' : 'status-pill warn'}>{decisionLabels[m.decision] || decisionLabels.missed}</span></td>
        <td className={`whitespace-nowrap font-mono text-sm ${m.potentialR == null ? 'text-muted-foreground' : toneOf(Number(m.potentialR)) === 'positive' ? 'text-success' : 'text-destructive'}`}>{m.potentialR == null ? '—' : rValue(Number(m.potentialR))}</td>
        <td><ChartLinks trade={m} /></td>
        <td className="max-w-sm text-xs text-muted-foreground"><span className="line-clamp-2">{m.notes || '—'}</span></td>
        <td>{!data.demo && <div className="flex"><IconButton label="Eintrag bearbeiten" onClick={() => setEditor(m)}><Pencil size={15} /></IconButton><IconButton label="Eintrag löschen" onClick={() => setDeleting(m)}><Trash2 size={15} /></IconButton></div>}</td>
      </tr>)}</tbody>
    </table></div>
    {!rows.length && !data.loading && <div className="journal-empty my-8"><EyeOff className="text-primary" /><h3>Noch keine nicht genommenen Trades</h3><p>Erfasse Setups, die du gesehen, aber nicht gehandelt hast. Schon nach wenigen Wochen siehst du, ob dich Zögern Geld kostet oder ob dich deine Regeln vor Verlusten schützen.</p></div>}
    <p className="mt-6 max-w-3xl text-xs leading-5 text-muted-foreground">Hypothetische Ergebnisse sind rückblickende Schätzungen und fließen nicht in Kontostand, Trefferquote oder Erwartungswert ein. Durchschnittlich {summary.opportunityCount ? decimal(summary.opportunityR / summary.opportunityCount) : '—'} R je verpasstem Setup mit Schätzung.</p>

    {editor && !data.demo && <MissedEditor entry={editor.id ? editor : null} accounts={data.accounts} setups={setups} onClose={() => setEditor(null)} onSaved={data.refresh} />}
    {deleting && <Dialog open onOpenChange={open => !open && !busy && setDeleting(null)}><DialogContent><DialogTitle>Eintrag löschen?</DialogTitle><DialogDescription>{deleting.symbol} · {getTradeDate(deleting)?.toLocaleDateString('de-DE')}</DialogDescription><div className="flex justify-end gap-3"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Abbrechen</Button><Button variant="destructive" disabled={busy} onClick={remove}>{busy ? 'Wird gelöscht…' : 'Löschen'}</Button></div></DialogContent></Dialog>}
  </div>;
}
