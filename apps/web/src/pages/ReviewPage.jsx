import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowDown, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJournalData } from '@/hooks/useJournalData';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';
import { PageHeading, PeriodToolbar, DataState, SignedValue, SectionTitle } from '@/components/journal/JournalUI';
import ReviewEditor from '@/components/journal/ReviewEditor';
import { getTradeDate, getTradeNetProfit } from '@/lib/tradeCalculations';
import { resolveReviewTrade } from '@/lib/journalNavigation';
import { reviewStatus, reviewStatusLabels, summarizeReviews } from '@/lib/review';
import { periodLabel } from '@/lib/journalPeriod';

export default function ReviewPage() {
  const data = useJournalData();
  const [params, setParams] = useSearchParams();
  const { confirmNavigation } = useNavigationGuard();
  const requestedId = params.get('trade');
  const [filter, setFilter] = useState(requestedId === null ? 'pending' : 'all');
  const queue = data.trades.filter(t => filter === 'all' || (filter === 'pending' ? reviewStatus(t) !== 'completed' : reviewStatus(t) === filter)).sort((a, b) => getTradeDate(b) - getTradeDate(a));
  const trade = resolveReviewTrade(data.allTrades, queue, requestedId);
  const outsidePeriod = trade && !data.trades.some(t => t.id === trade.id);
  const outsideQueue = trade && !queue.some(t => t.id === trade.id);
  const summary = summarizeReviews(data.trades);
  const actions = data.trades.filter(t => reviewStatus(t) === 'completed' && t.reviewAction?.trim()).sort((a, b) => getTradeDate(b) - getTradeDate(a));
  const selectTrade = id => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (id === null) next.delete('trade'); else next.set('trade', id);
    return next;
  });
  const showTradeMonth = () => {
    const date = getTradeDate(trade);
    if (date) data.setPeriod({ month: date, range: 'month' });
  };

  return <div className="journal-page">
    <Helmet><title>Review · The Trading Desk</title></Helmet>
    <PageHeading eyebrow="Prozess vor Ergebnis" title="Review">Prüfe deine Ausführung. Halte eine Erkenntnis und deinen nächsten Schritt fest.</PageHeading>
    <PeriodToolbar data={data} />
    <DataState data={data} />
    {!data.loading && !data.error && <>
      <div className="flex flex-wrap gap-5 items-center border-y py-4 mb-6">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Review-Fortschritt">
          <span><strong>{summary.completed}</strong> abgeschlossen</span><span><strong>{summary.draft}</strong> Entwürfe</span><span><strong>{summary.open}</strong> offen</span>
        </div>
        <label className="ml-auto text-xs text-muted-foreground">Review-Status
          <select className="ml-2 h-10 rounded-md border bg-background px-2 text-sm text-foreground" value={filter} onChange={e => { if (confirmNavigation()) setFilter(e.target.value); }}>
            <option value="pending">Noch nicht abgeschlossen</option><option value="open">Offen</option><option value="draft">Entwürfe</option><option value="completed">Abgeschlossen</option><option value="all">Alle Reviews</option>
          </select>
        </label>
      </div>
      <div className="review-layout grid lg:grid-cols-[260px_minmax(0,1fr)] gap-8">
        <section>
          <SectionTitle number="01" title="Review-Liste" />
          <div className="review-queue max-h-[540px] overflow-y-auto">
            {queue.map(t => <button key={t.id} aria-pressed={trade?.id === t.id} onClick={() => { if (trade?.id !== t.id) selectTrade(t.id); }} className={'w-full border-b p-4 text-left ' + (trade?.id === t.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-secondary/30')}>
              <span className="flex justify-between gap-2 text-sm"><strong>{t.symbol}</strong><SignedValue value={getTradeNetProfit(t, data.balances, data.balances)} /></span>
              <span className="mt-2 block text-xs text-muted-foreground">{getTradeDate(t)?.toLocaleDateString('de-DE')} · {t.setup || 'Ohne Setup'}</span>
              <span className="block mt-1 text-xs text-primary">{reviewStatusLabels[reviewStatus(t)]}</span>
            </button>)}
            {!queue.length && <p className="py-4 text-sm text-muted-foreground">Keine Trades in dieser Liste.</p>}
          </div>
          {trade && <Button asChild variant="outline" size="sm" className="mt-3 lg:hidden"><a href="#review-editor"><ArrowDown size={14} className="mr-2" />Zum ausgewählten Review</a></Button>}
        </section>
        <section id="review-editor" className="min-w-0 scroll-mt-24">
          {trade ? <>
            {outsideQueue && <div role="status" className="border-l-2 border-primary pl-4 mb-6 text-sm">
              <p>{outsidePeriod ? 'Der verlinkte Trade liegt außerhalb des gewählten Zeitraums. Angezeigt wird genau dieser Trade.' : 'Der verlinkte Trade passt nicht zum gewählten Statusfilter. Er bleibt zur Bearbeitung geöffnet.'}</p>
              {outsidePeriod && getTradeDate(trade) && <Button variant="outline" size="sm" className="mt-3" onClick={showTradeMonth}>Monat dieses Trades anzeigen</Button>}
            </div>}
            <SectionTitle number="02" title={trade.symbol + ' · ' + (trade.setup || 'Ohne Setup')} />
            <p className="text-xs text-muted-foreground mb-4">Einstieg: {getTradeDate(trade)?.toLocaleDateString('de-DE')} · {trade.entryTime || 'Uhrzeit nicht erfasst'} · {data.accounts.find(a => a.id === trade.accountId)?.accountName || data.accountName}</p>
            <ReviewEditor key={trade.id} trade={trade} data={data} />
          </> : requestedId !== null ? <div className="journal-empty" role="status">
            <h3>Trade nicht verfügbar</h3>
            <p>Dieser Trade wurde nicht gefunden oder gehört nicht zum ausgewählten Konto. Es wurde kein anderer Trade geöffnet.</p>
            <Button variant="outline" onClick={() => selectTrade(null)}>Zur gefilterten Liste</Button>
          </div> : <div className="journal-empty">
            <CheckCircle2 className="text-primary" />
            <h3>{data.trades.length ? 'Keine Reviews in dieser Auswahl' : 'Noch keine Reviews'}</h3>
            <p>{data.trades.length ? 'Ändere den Statusfilter, um weitere Reviews zu sehen.' : 'Deine abgeschlossenen Trades erscheinen hier.'}</p>
          </div>}
        </section>
      </div>
      <section className="journal-section">
        <SectionTitle number="03" title={data.range === 'week' ? 'Dein Wochenrückblick' : 'Dein Rückblick im Zeitraum'} />
        <p className="text-xs text-muted-foreground mb-5">{periodLabel(data)} · Nach Einstiegsdatum · {summary.completed} von {data.trades.length} Reviews abgeschlossen</p>
        <div className="grid gap-8 lg:grid-cols-2">
          <div><h3 className="text-sm font-medium mb-3">Deine erfassten Lern-Tags</h3>
            {summary.tags.length ? <dl className="space-y-3">{summary.tags.map(tag => <div key={tag.id} className="flex justify-between gap-4 border-b pb-2 text-sm"><dt>{tag.label}</dt><dd>{tag.count} {tag.count === 1 ? 'Review' : 'Reviews'}</dd></div>)}</dl> : <p className="text-sm text-muted-foreground">Noch keine Lern-Tags in abgeschlossenen Reviews.</p>}
            <p className="text-xs text-muted-foreground mt-4">Selbsteinschätzungen, kein Qualitäts-Score. Mehrere Tags pro Review sind möglich.</p>
          </div>
          <div><h3 className="text-sm font-medium mb-3">Das nimmst du in die nächste Session mit</h3>
            {actions.length ? <ul className="space-y-4 max-h-80 overflow-y-auto">{actions.map(t => <li key={t.id} className="border-l-2 border-primary pl-4"><button className="text-xs text-primary hover:underline" onClick={() => selectTrade(t.id)}>{t.symbol} · {getTradeDate(t)?.toLocaleDateString('de-DE')}</button><p className="mt-2 text-sm whitespace-pre-wrap break-words">{t.reviewAction}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">Deine nächsten Schritte erscheinen hier, sobald du einen Review abschließt.</p>}
          </div>
        </div>
      </section>
    </>}
  </div>;
}
