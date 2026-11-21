import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Plus, Download, Search, Pencil, Trash2, ChevronLeft, ChevronRight, ExternalLink, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useJournalData } from '@/hooks/useJournalData';
import { PageHeading, PeriodToolbar, DataState, SignedValue, IconButton, StatGrid, toneOf } from '@/components/journal/JournalUI';
import TradeEditor from '@/components/journal/TradeEditor';
import { getTradeNetProfit, getTradeRiskBasis, getTradeDate } from '@/lib/tradeCalculations';
import RiskBasisLabel from '@/components/journal/RiskBasisLabel';
import { tradesToCsv } from '@/lib/tradeExport';
import { money, rValue, percent, decimal } from '@/lib/format';
import pb from '@/lib/pocketbaseClient';
import { reviewStatus, reviewStatusLabels } from '@/lib/review';
import { sideLabel, emotionLabels, holdingMinutes, formatDuration, sessionOf } from '@/lib/proJournal';

const selectClass = 'h-10 rounded-md border bg-background px-3 text-sm';
const PAGE = 25;

export default function TradesPage() {
  const data = useJournalData();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(''), [status, setStatus] = useState('all'), [setup, setSetup] = useState('all'), [side, setSide] = useState('all'), [grade, setGrade] = useState('all');
  const [page, setPage] = useState(1), [editor, setEditor] = useState(null), [deleting, setDeleting] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    if (params.get('new') === '1' && !data.demo && data.accounts.length) { setEditor({}); setParams(p => { const n = new URLSearchParams(p); n.delete('new'); return n; }, { replace: true }); }
  }, [params, data.demo, data.accounts.length, setParams]);
  const setups = useMemo(() => [...new Set(data.allTrades.map(t => t.setup).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de')), [data.allTrades]);
  const rows = useMemo(() => data.trades.map(t => {
    const net = getTradeNetProfit(t, data.balances, data.balances);
    const basis = getTradeRiskBasis(t, data.balances, data.balances);
    return { t, net, risk: basis.amount, source: basis.source, r: basis.amount ? net / basis.amount : null, hold: holdingMinutes(t) };
  }).filter(({ t, net }) => [t.symbol, t.setup, t.notes, t.reviewLesson].join(' ').toLowerCase().includes(search.toLowerCase())
    && (status === 'all' || status === 'win' && net > 0 || status === 'loss' && net < 0 || status === 'breakeven' && net === 0)
    && (setup === 'all' || (t.setup || '') === setup)
    && (side === 'all' || sideLabel(t.side).toLowerCase() === side)
    && (grade === 'all' || (t.grade || 'none') === grade)
  ).sort((a, b) => getTradeDate(b.t) - getTradeDate(a.t)), [data.trades, data.balances, search, status, setup, side, grade]);
  const filtered = search || status !== 'all' || setup !== 'all' || side !== 'all' || grade !== 'all';
  const summary = useMemo(() => {
    const wins = rows.filter(r => r.net > 0), losses = rows.filter(r => r.net < 0);
    const gain = wins.reduce((s, r) => s + r.net, 0), loss = Math.abs(losses.reduce((s, r) => s + r.net, 0));
    const rs = rows.map(r => r.r).filter(Number.isFinite);
    return { net: gain - loss, winRate: rows.length ? wins.length / rows.length * 100 : null, pf: loss ? gain / loss : gain ? Infinity : null, avgR: rs.length ? rs.reduce((s, v) => s + v, 0) / rs.length : null, totalR: rs.reduce((s, v) => s + v, 0) };
  }, [rows]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE)), current = Math.min(page, pages), visible = rows.slice((current - 1) * PAGE, current * PAGE);
  const resetFilters = () => { setSearch(''); setStatus('all'); setSetup('all'); setSide('all'); setGrade('all'); setPage(1); };
  const onFilter = setter => e => { setter(e.target.value); setPage(1); };
  function download() { const url = URL.createObjectURL(new Blob([tradesToCsv(rows.map(r => r.t), data.balances)], { type: 'text/csv;charset=utf-8;' })); const a = document.createElement('a'); a.href = url; a.download = (data.demo ? 'demo-' : '') + 'trading-journal.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  async function remove() { setBusy(true); setError(''); try { await pb.collection('trades').delete(deleting.id); await data.refresh(); setDeleting(null); } catch { setError('Löschen fehlgeschlagen. Dein Trade wurde nicht aus dieser Ansicht entfernt.'); } finally { setBusy(false); } }

  return <div className="journal-page">
    <Helmet><title>Trade-Journal · The Trading Desk</title></Helmet>
    <PageHeading eyebrow="Dokumentation" title="Trade-Journal" action={data.demo ? <Button asChild><Link to="/signup">Eigenes Journal starten</Link></Button> : <Button onClick={() => setEditor({})} disabled={!data.accounts.length}><Plus size={16} className="mr-2" />Trade erfassen</Button>}>Jede Ausführung, nachvollziehbar dokumentiert: Risiko, Ergebnis, Qualität und Review.</PageHeading>
    <PeriodToolbar data={data} /><DataState data={data} />
    {!data.demo && !data.accounts.length && <div className="journal-empty mb-8"><h3>Dein erstes Handelskonto</h3><p>Lege zuerst ein Konto mit Anfangskapital an.</p><Button asChild variant="outline"><Link to="/settings">Konto anlegen</Link></Button></div>}

    <div className="trade-filters mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 basis-60 max-w-sm"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><Input className="pl-9" aria-label="Trades durchsuchen" placeholder="Symbol, Setup, Notiz suchen" value={search} onChange={onFilter(setSearch)} /></div>
      <select aria-label="Ergebnis filtern" className={selectClass} value={status} onChange={onFilter(setStatus)}><option value="all">Alle Ergebnisse</option><option value="win">Gewinn</option><option value="loss">Verlust</option><option value="breakeven">Break-even</option></select>
      <select aria-label="Setup filtern" className={selectClass} value={setup} onChange={onFilter(setSetup)}><option value="all">Alle Setups</option>{setups.map(s => <option key={s} value={s}>{s}</option>)}</select>
      <select aria-label="Richtung filtern" className={selectClass} value={side} onChange={onFilter(setSide)}><option value="all">Long & Short</option><option value="long">Long</option><option value="short">Short</option></select>
      <select aria-label="Setup-Qualität filtern" className={selectClass} value={grade} onChange={onFilter(setGrade)}><option value="all">Alle Qualitäten</option><option value="A">A-Setups</option><option value="B">B-Setups</option><option value="C">C-Setups</option><option value="none">Ohne Note</option></select>
      {filtered && <Button variant="ghost" size="sm" onClick={resetFilters}><FilterX size={15} className="mr-1" />Filter zurücksetzen</Button>}
      <Button variant="outline" className="ml-auto" onClick={download} disabled={!rows.length}><Download size={16} className="mr-2" />CSV ({rows.length})</Button>
    </div>

    {rows.length > 0 && <div className="mb-5"><StatGrid columns={5} items={[
      { label: filtered ? 'Netto (Auswahl)' : 'Netto-Ergebnis', helpKey: 'netPnl', value: money(summary.net, true), tone: toneOf(summary.net), detail: `${rows.length} Trades` },
      { label: 'Trefferquote', value: percent(summary.winRate) },
      { label: 'Profitfaktor', value: summary.pf === null ? '—' : decimal(summary.pf) },
      { label: 'Erwartungswert', value: rValue(summary.avgR), tone: toneOf(summary.avgR) },
      { label: 'Gesamt-R', value: rValue(summary.totalR), tone: toneOf(summary.totalR) },
    ]} /></div>}

    <div className="journal-table-wrap trade-ledger" tabIndex={0} role="region" aria-label="Trade-Tabelle"><table className="journal-table">
      <thead><tr>{['Trade', 'Setup', 'Netto', 'Netto-R / Basis', 'Haltedauer', 'Psychologie', 'Kosten', 'Review', ''].map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
      <tbody>{visible.map(({ t, net, risk, source, r, hold }) => <tr key={t.id}>
        <td className="min-w-40"><strong className="flex items-center gap-2">{t.symbol}{sideLabel(t.side) !== '—' && <span className={'side-badge ' + sideLabel(t.side).toLowerCase()}>{sideLabel(t.side)}</span>}{t.contextUrl && <a href={t.contextUrl} target="_blank" rel="noreferrer noopener" aria-label={`Chart zu ${t.symbol} öffnen`} className="text-muted-foreground hover:text-primary"><ExternalLink size={13} /></a>}</strong><span className="sub">{getTradeDate(t)?.toLocaleDateString('de-DE')} · {t.entryTime}{sessionOf(t.entryTime) ? ' · ' + sessionOf(t.entryTime).label : ''}</span></td>
        <td className="min-w-36"><span className="flex items-center gap-2">{t.grade && <span className={'grade-badge grade-' + t.grade} title={`${t.grade}-Setup`}>{t.grade}</span>}{t.setup || <span className="text-muted-foreground">Nicht erfasst</span>}</span>{t.plannedRR != null && <span className="sub">Ziel {decimal(Number(t.plannedRR), 1)} R</span>}</td>
        <td className="whitespace-nowrap"><SignedValue value={net} /><span className="sub font-mono">Brutto {money(t.profitLoss)}</span></td>
        <td className="whitespace-nowrap text-xs"><span className="block font-mono text-sm">{risk ? rValue(r) : '—'}</span><RiskBasisLabel source={source} /></td>
        <td className="whitespace-nowrap font-mono text-xs">{formatDuration(hold)}{t.mfe != null && <span className="sub">MFE {decimal(Number(t.mfe), 1)} R{t.mae != null ? ` · MAE ${decimal(Number(t.mae), 1)} R` : ''}</span>}</td>
        <td className="whitespace-nowrap text-xs">{t.emotion ? emotionLabels[t.emotion] : <span className="text-muted-foreground">—</span>}{t.confidence ? <span className="sub">Überzeugung {t.confidence}/5</span> : null}</td>
        <td className="whitespace-nowrap font-mono text-xs">{money(Number(t.profitLoss) - net)}</td>
        <td><Link className={reviewStatus(t) === 'completed' ? 'text-xs text-muted-foreground hover:underline' : 'review-pending'} to={(data.demo ? '/demo' : '') + '/review?trade=' + t.id}>{reviewStatusLabels[reviewStatus(t)]}</Link></td>
        <td>{!data.demo && <div className="flex"><IconButton label="Trade bearbeiten" onClick={() => setEditor(t)}><Pencil size={15} /></IconButton><IconButton label="Trade löschen" onClick={() => setDeleting(t)}><Trash2 size={15} /></IconButton></div>}</td>
      </tr>)}</tbody>
    </table></div>
    {!rows.length && !data.loading && <div className="journal-empty my-8"><h3>Keine Trades in dieser Auswahl</h3><p>Wähle einen anderen Zeitraum oder passe deine Filter an.</p>{filtered && <Button variant="outline" onClick={resetFilters}>Filter zurücksetzen</Button>}</div>}
    <div className="flex justify-between items-center py-5 text-xs text-muted-foreground"><span>{rows.length} Trades · Seite {current} von {pages}</span><div className="flex"><IconButton label="Vorherige Seite" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft /></IconButton><IconButton label="Nächste Seite" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight /></IconButton></div></div>
    {editor && !data.demo && <TradeEditor trade={editor.id ? editor : null} accounts={data.accounts} setupSuggestions={setups} onClose={() => setEditor(null)} onSaved={data.refresh} />}
    {deleting && <Dialog open onOpenChange={open => !open && !busy && setDeleting(null)}><DialogContent><DialogTitle>Trade endgültig löschen?</DialogTitle><DialogDescription>{deleting.symbol} · Diese Aktion entfernt auch deinen zugehörigen Review.</DialogDescription>{error && <p role="alert">{error}</p>}<div className="flex justify-end gap-3"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Abbrechen</Button><Button variant="destructive" disabled={busy} onClick={remove}>{busy ? 'Wird gelöscht…' : 'Endgültig löschen'}</Button></div></DialogContent></Dialog>}
  </div>;
}
