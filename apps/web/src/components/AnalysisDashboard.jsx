import React, { useMemo } from 'react';
import { useFilters } from '@/contexts/FilterContext.jsx';
import EditableStartingBalance from './EditableStartingBalance.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildDayPerformance,
  buildSymbolPerformance,
  buildWeekdayPerformance,
  calculateAdvancedStats,
  calculateTotalCommissionCosts,
} from '@/lib/tradeCalculations.js';

const metricDescriptions = {
  "Netto P&L": "Gesamter Gewinn oder Verlust nach Abzug aller Gebühren.",
  "Gewinne gesamt (Netto)": "Gesamter Gewinn aller positiven Trades nach Gebühren.",
  "Verluste gesamt": "Gesamtsumme aller Verlust-Trades.",
  "Gebühren gesamt": "Alle an den Broker gezahlten Gebühren für ausgeführte Trades.",
  "Kontostand inkl. P&L": "Aktueller Kontostand inklusive Startkapital und Netto P&L.",
  "Gesamtrendite": "Prozentuale Rendite auf die ursprüngliche Kontogröße.",
  "Trades gesamt": "Gesamtzahl der erfassten Trades.",
  "Trefferquote": "Anteil der Trades, die mit Gewinn geschlossen wurden.",
  "Verlustquote": "Anteil der Trades, die mit Verlust geschlossen wurden.",
  "Break-even-Quote": "Anteil der Trades ohne Gewinn oder Verlust.",
  "Gesichertes R": "Summe aller gewonnenen oder verlorenen R-Multiples.",
  "Ø R / Trade": "Durchschnittliches R-Multiple pro Trade.",
  "Risiko pro Trade": "Durchschnittlich riskierter Anteil des Kontos pro Trade.",
  "Erwartungswert": "Durchschnittlich erwarteter monetärer Ertrag pro Trade auf Basis deiner Historie.",
  "Erwartungswert R": "Durchschnittlich erwartetes R-Multiple pro Trade. Eine der saubersten Edge-Kennzahlen.",
  "Payoff-Ratio": "Durchschnittlicher Gewinn-Trade geteilt durch durchschnittlichen Verlust-Trade.",
  "Profit-Faktor": "Verhältnis von Bruttogewinn zu Bruttoverlust. Werte über 1 zeigen ein profitables System an.",
  "Ø Gewinn R": "Durchschnittliches R-Multiple gewonnener Trades.",
  "Ø Verlust R": "Durchschnittliches R-Multiple verlorener Trades.",
  "Ø Stop-Größe": "Durchschnittlicher monetärer Betrag, der pro Trade riskiert wurde.",
  "Max. Drawdown %": "Größter prozentualer Rückgang von einem Kontostand-Hoch zum folgenden Tief.",
  "Max. Drawdown €": "Größter monetärer Rückgang von einem Kontostand-Hoch zum folgenden Tief.",
  "Gewinnserie": "Längste Serie profitabler Trades.",
  "Verlustserie": "Längste Serie verlorener Trades.",
  "Aktuelle Serie": "Aktuelle Serie auf Basis der letzten Trades.",
  "Bestes Symbol": "Profitabelstes Symbol in der ausgewählten Datenmenge.",
  "Schwächstes Symbol": "Schwächstes Symbol in der ausgewählten Datenmenge.",
  "Bester Tag": "Profitabelster Trading-Tag in der ausgewählten Datenmenge.",
  "Schwächster Tag": "Schwächster Trading-Tag in der ausgewählten Datenmenge.",
  "Bester Wochentag": "Profitabelster Wochentag in der ausgewählten Datenmenge.",
  "Schwächster Wochentag": "Schwächster Wochentag in der ausgewählten Datenmenge."
};

const MetricCard = ({ label, value, type = 'neutral' }) => {
  const typeClasses = {
    positive: 'metric-card-positive',
    negative: 'metric-card-negative',
    neutral: 'metric-card-neutral',
  };

  const description = metricDescriptions[label] || "Keine Beschreibung verfügbar.";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`metric-card ${typeClasses[type]} cursor-help transition-all duration-200 hover:shadow-md`}>
          <p className="metric-label">{label}</p>
          <p className="metric-value break-words">{value}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[250px] text-center">
        <p className="text-sm">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const MetricSection = ({ title, metrics }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold tracking-tight border-b border-border pb-2">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {metrics.map((m, i) => (
        <MetricCard key={i} label={m.label} value={m.value} type={m.type} />
      ))}
    </div>
  </div>
);

const RankingBoard = ({ title, description, items }) => (
  <Card className="glass-panel overflow-hidden rounded-lg">
    <CardHeader className="border-b border-white/10">
      <p className="section-kicker mb-2">Ranking</p>
      <CardTitle className="text-xl font-black">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      {items.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">Keine Ranking-Daten verfügbar.</p>
      ) : (
        <div className="divide-y divide-white/10">
          <div className="grid grid-cols-[1fr_64px_72px_96px] gap-3 bg-black/20 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
            <span>Name</span>
            <span>Trades</span>
            <span>Ø R</span>
            <span className="text-right">Netto</span>
          </div>
          {items.map((item) => (
            <div key={item.key} className="grid grid-cols-[1fr_64px_72px_96px] items-center gap-3 px-4 py-4 text-sm">
              <div className="min-w-0">
                <p className="truncate font-black">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.winRate.toFixed(1)}% Trefferquote</p>
              </div>
              <p className="font-semibold">{item.trades}</p>
              <p className={`font-black ${item.avgR >= 0 ? 'text-success' : 'text-destructive'}`}>
                {item.avgR >= 0 ? '+' : ''}{item.avgR.toFixed(2)}R
              </p>
              <p className={`text-right font-black ${item.netPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {item.netPnL >= 0 ? '+' : ''}{formatEuro(item.netPnL)}
              </p>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

const InsightPanel = ({ stats }) => {
  const insights = [
    { label: 'Bester Tag', value: formatPerformanceLabel(stats.bestDay), type: 'positive' },
    { label: 'Schwächster Tag', value: formatPerformanceLabel(stats.worstDay), type: stats.worstDay?.netPnL < 0 ? 'negative' : 'neutral' },
    { label: 'Bester Wochentag', value: formatPerformanceLabel(stats.bestWeekday), type: 'positive' },
    { label: 'Aktuelle Serie', value: formatStreak(stats.currentStreakType, stats.currentStreakCount), type: stats.currentStreakType === 'loss' ? 'negative' : stats.currentStreakType === 'win' ? 'positive' : 'neutral' },
  ];

  return (
    <Card className="command-panel rounded-lg">
      <CardHeader className="border-b border-white/10">
        <p className="section-kicker mb-2">Session-Intelligenz</p>
        <CardTitle className="text-xl font-black">Schnellcheck</CardTitle>
        <CardDescription>Die wichtigsten Timing- und Disziplin-Signale auf einen Blick.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {insights.map((item) => (
          <div key={item.label} className="rounded-md border border-white/10 bg-black/20 p-4">
            <p className="surface-label">{item.label}</p>
            <p className={`mt-2 text-lg font-black ${item.type === 'positive' ? 'text-success' : item.type === 'negative' ? 'text-destructive' : 'text-foreground'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const formatEuro = (value) => new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
}).format(Number(value) || 0);

const formatRatio = (value) => value === Infinity ? '∞' : Number(value || 0).toFixed(2);

const formatPerformanceLabel = (item) => {
  if (!item) return 'Keine Daten';
  const sign = item.netPnL >= 0 ? '+' : '';
  return `${item.label} ${sign}${formatEuro(item.netPnL)}`;
};

const formatStreak = (type, count) => {
  if (!count || type === 'none' || type === 'breakeven') return 'Keine aktive Serie';
  return `${count} ${type === 'win' ? 'Gewinne' : 'Verluste'}`;
};

const AnalysisDashboard = ({ trades, accounts, originalBalances, selectedAccountId, onUpdateBalance }) => {
  const { filters, isFiltersActive, clearFilters } = useFilters();

  const isAllAccounts = !selectedAccountId;
  const currentBalancesMap = accounts.reduce((acc, a) => { acc[a.id] = a.startingBalance; return acc; }, {});
  const totalCurrentBalance = isAllAccounts
    ? accounts.reduce((sum, a) => sum + (a.startingBalance || 0), 0)
    : (accounts.find(a => a.id === selectedAccountId)?.startingBalance || 10000);

  const getFilterDescription = () => {
    const parts = [];
    if (filters.symbol) parts.push(filters.symbol.toUpperCase());
    const statusLabels = { Win: 'Gewinn', Loss: 'Verlust', Breakeven: 'Break-even' };
    if (filters.status !== 'All') parts.push(statusLabels[filters.status] || filters.status);
    
    if (filters.startDate && filters.endDate) {
      parts.push(`${filters.startDate} bis ${filters.endDate}`);
    } else if (filters.startDate) {
      parts.push(`Ab ${filters.startDate}`);
    } else if (filters.endDate) {
      parts.push(`Bis ${filters.endDate}`);
    }
    
    return parts.join(' • ');
  };

  const stats = useMemo(() => {
    if (!trades || trades.length === 0) return null;
    const totalCommission = calculateTotalCommissionCosts(trades, originalBalances, currentBalancesMap);

    return {
      ...calculateAdvancedStats(trades, totalCurrentBalance, originalBalances, currentBalancesMap),
      totalCurrentBalance,
      totalCommission,
    };
  }, [trades, currentBalancesMap, originalBalances, totalCurrentBalance]);

  const symbolRankings = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    return buildSymbolPerformance(trades, originalBalances, currentBalancesMap).slice(0, 6);
  }, [trades, currentBalancesMap, originalBalances]);

  const weekdayRankings = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    return [...buildWeekdayPerformance(trades, originalBalances, currentBalancesMap)]
      .filter((item) => item.trades > 0)
      .sort((a, b) => b.netPnL - a.netPnL);
  }, [trades, currentBalancesMap, originalBalances]);

  const dayRankings = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    return buildDayPerformance(trades, originalBalances, currentBalancesMap).slice(0, 6);
  }, [trades, currentBalancesMap, originalBalances]);

  const hasData = stats !== null;

  const balanceMetrics = hasData ? [
    { label: "Gewinne gesamt (Netto)", value: formatEuro(stats.grossProfit), type: "positive" },
    { label: "Verluste gesamt", value: `-${formatEuro(stats.grossLoss)}`, type: "negative" },
    { label: "Gebühren gesamt", value: formatEuro(stats.totalCommission), type: "negative" },
    { label: "Kontostand inkl. P&L", value: formatEuro(stats.endingBalance), type: stats.endingBalance >= stats.totalCurrentBalance ? "positive" : "negative" },
  ] : [];

  const edgeMetrics = hasData ? [
    { label: "Netto P&L", value: `${stats.netPnL >= 0 ? '+' : '-'}${formatEuro(Math.abs(stats.netPnL))}`, type: stats.netPnL >= 0 ? "positive" : "negative" },
    { label: "Gesamtrendite", value: `${((stats.netPnL / Math.max(stats.totalCurrentBalance, 0.01)) * 100).toFixed(2)}%`, type: stats.netPnL >= 0 ? "positive" : "negative" },
    { label: "Erwartungswert R", value: `${stats.expectancyR > 0 ? '+' : ''}${stats.expectancyR.toFixed(2)}R`, type: stats.expectancyR >= 0 ? "positive" : "negative" },
    { label: "Payoff-Ratio", value: formatRatio(stats.payoffRatio), type: stats.payoffRatio >= 1.2 ? "positive" : (stats.payoffRatio >= 1 ? "neutral" : "negative") },
    { label: "Profit-Faktor", value: formatRatio(stats.profitFactor), type: stats.profitFactor >= 1.5 ? "positive" : (stats.profitFactor >= 1 ? "neutral" : "negative") },
    { label: "Max. Drawdown %", value: `${stats.maxDrawdownPct.toFixed(2)}%`, type: stats.maxDrawdownPct > 20 ? "negative" : "neutral" },
    { label: "Ø R / Trade", value: `${stats.avgR > 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`, type: stats.avgR >= 0 ? "positive" : "negative" },
    { label: "Trefferquote", value: `${stats.winRate.toFixed(1)}%`, type: stats.winRate >= 50 ? "positive" : "negative" },
  ] : [];

  const detailSections = hasData ? [
    {
      title: "Trade-Statistiken",
      metrics: [
        { label: "Trades gesamt", value: stats.totalTrades, type: "neutral" },
        { label: "Trefferquote", value: `${stats.winRate.toFixed(1)}%`, type: stats.winRate >= 50 ? "positive" : "negative" },
        { label: "Verlustquote", value: `${stats.lossRate.toFixed(1)}%`, type: stats.lossRate > 50 ? "negative" : "positive" },
        { label: "Break-even-Quote", value: `${stats.breakevenRate.toFixed(1)}%`, type: "neutral" },
      ]
    },
    {
      title: "Risiko-Kennzahlen",
      metrics: [
        { label: "Gesichertes R", value: `${stats.totalR > 0 ? '+' : ''}${stats.totalR.toFixed(2)}R`, type: stats.totalR >= 0 ? "positive" : "negative" },
        { label: "Ø R / Trade", value: `${stats.avgR > 0 ? '+' : ''}${stats.avgR.toFixed(2)}R`, type: stats.avgR >= 0 ? "positive" : "negative" },
        { label: "Risiko pro Trade", value: `${stats.avgRiskPct.toFixed(2)}%`, type: stats.avgRiskPct > 2 ? "negative" : "neutral" },
        { label: "Ø Stop-Größe", value: formatEuro(stats.avgStopLossAmount), type: "neutral" },
      ]
    },
    {
      title: "Edge & Serien",
      metrics: [
        { label: "Erwartungswert", value: formatEuro(stats.expectancy), type: stats.expectancy > 0 ? "positive" : "negative" },
        { label: "Ø Gewinn R", value: `${stats.avgWinR.toFixed(2)}R`, type: stats.avgWinR >= 2 ? "positive" : "neutral" },
        { label: "Ø Verlust R", value: `${stats.avgLossR.toFixed(2)}R`, type: "negative" },
        { label: "Gewinnserie", value: `${stats.longestWinStreak}`, type: "positive" },
        { label: "Verlustserie", value: `${stats.longestLossStreak}`, type: stats.longestLossStreak >= 4 ? "negative" : "neutral" },
      ]
    },
    {
      title: "Drawdown-Kennzahlen",
      metrics: [
        { label: "Max. Drawdown %", value: `${stats.maxDrawdownPct.toFixed(2)}%`, type: stats.maxDrawdownPct > 20 ? "negative" : "neutral" },
        { label: "Max. Drawdown €", value: formatEuro(stats.maxDrawdown), type: "negative" },
        { label: "Aktuelle Serie", value: formatStreak(stats.currentStreakType, stats.currentStreakCount), type: stats.currentStreakType === "loss" ? "negative" : stats.currentStreakType === "win" ? "positive" : "neutral" },
        { label: "Schwächster Tag", value: formatPerformanceLabel(stats.worstDay), type: stats.worstDay?.netPnL < 0 ? "negative" : "neutral" },
      ]
    }
  ] : [];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-10">
        {isFiltersActive() && (
          <Alert className="bg-primary/5 text-primary border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <AlertDescription className="font-medium">
                Gefilterte Ergebnisse: <span className="opacity-80 font-normal">{getFilterDescription()}</span>
              </AlertDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-8 gap-1 shrink-0">
              <X className="w-3 h-3" />
              Filter löschen
            </Button>
          </Alert>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight border-b border-border pb-2">Kontoeinstellungen & Balance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <EditableStartingBalance 
              accounts={accounts} 
              selectedAccountId={selectedAccountId} 
              onSave={onUpdateBalance} 
            />
            {hasData && balanceMetrics.map((m, i) => (
              <MetricCard key={i} label={m.label} value={m.value} type={m.type} />
            ))}
          </div>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card rounded-2xl border border-border shadow-sm">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Noch keine Trading-Daten</h3>
            <p className="text-muted-foreground max-w-md">
              {isFiltersActive() 
                ? "Keine Trades passen zu deinen aktuellen Filtern. Passe sie an."
                : "Dein Startkapital ist gesetzt. Erfasse deinen ersten Trade, um umfassende Analysen und Performance-Kennzahlen freizuschalten."}
            </p>
            {isFiltersActive() && (
              <Button variant="outline" className="mt-6" onClick={clearFilters}>
                Filter löschen
              </Button>
            )}
          </div>
        ) : (
          <>
            <MetricSection title="Edge-Überblick" metrics={edgeMetrics} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <RankingBoard
                title="Symbol-Ranking"
                description="Märkte sortiert nach Netto-Performance in der ausgewählten Datenmenge."
                items={symbolRankings}
              />
              <RankingBoard
                title="Wochentags-Ranking"
                description="Welche Wochentage am stärksten zu deinen Ergebnissen beitragen."
                items={weekdayRankings}
              />
              <RankingBoard
                title="Trading-Tage-Ranking"
                description="Beste einzelne Trading-Tage nach Netto-Performance."
                items={dayRankings}
              />
            </div>

            <InsightPanel stats={stats} />

            <div className="space-y-8">
              {detailSections.map((section, idx) => (
                <MetricSection key={idx} title={section.title} metrics={section.metrics} />
              ))}
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AnalysisDashboard;
