// Labels and analysis helpers for the professional journal fields and the missed-trade log.
import { buildProcessedTrades, getTradeDate } from './tradeCalculations.js';
import { parseDay } from './journalPeriod.js';

export const gradeOptions = [['A', 'A – Lehrbuch-Setup'], ['B', 'B – Solide, kleine Abweichung'], ['C', 'C – Grenzwertig']];
export const emotionOptions = [
  ['calm', 'Ruhig & fokussiert'], ['confident', 'Zuversichtlich'], ['fomo', 'FOMO / Angst, etwas zu verpassen'],
  ['fearful', 'Ängstlich / zögerlich'], ['greedy', 'Gierig'], ['frustrated', 'Frustriert / Revenge'], ['bored', 'Gelangweilt'],
];
export const emotionLabels = Object.fromEntries(emotionOptions.map(([key, label]) => [key, label.split(' / ')[0].split(' & ')[0]]));
export const missedReasonOptions = [
  ['rules', 'Regeln nicht vollständig erfüllt'], ['risk_limit', 'Tages-/Risikolimit erreicht'], ['news', 'News oder Event-Risiko'],
  ['conditions', 'Spread, Liquidität oder Volatilität'], ['hesitation', 'Gezögert'], ['fear', 'Angst nach vorherigem Verlust'],
  ['absent', 'Nicht am Bildschirm'], ['execution', 'Order/Plattform-Problem'], ['other', 'Sonstiges'],
];
export const missedReasonLabels = Object.fromEntries(missedReasonOptions);
// Reasons that normally describe a disciplined, rule-based skip.
export const disciplinedReasons = new Set(['rules', 'risk_limit', 'news', 'conditions']);
export const decisionLabels = { valid: 'Bewusst ausgelassen', missed: 'Verpasst' };
export const sideLabel = side => side === 'long' || side === 'Long' ? 'Long' : side === 'short' || side === 'Short' ? 'Short' : '—';

// Trading sessions in German local time (CET/CEST), the time the journal records.
export const sessions = [
  { key: 'asia', label: 'Asien', range: '00:00–08:59', from: 0, to: 9 },
  { key: 'london', label: 'London', range: '09:00–14:59', from: 9, to: 15 },
  { key: 'newyork', label: 'New York', range: '15:00–21:59', from: 15, to: 22 },
  { key: 'late', label: 'Spätsession', range: '22:00–23:59', from: 22, to: 24 },
];
export function sessionOf(time) {
  const match = String(time || '').match(/^(\d{2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  return sessions.find(s => hour >= s.from && hour < s.to) || null;
}

const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;

export function holdingMinutes(trade) {
  const exit = parseDay(String(trade?.exitDate || '').slice(0, 10));
  const entry = getTradeDate(trade);
  const time = String(trade?.exitTime || '').match(/^(\d{2}):(\d{2})$/);
  if (!exit || !entry || !time) return null;
  exit.setHours(Number(time[1]), Number(time[2]), 0, 0);
  const minutes = (exit - entry) / 60000;
  return minutes >= 0 ? minutes : null;
}

export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return '—';
  if (minutes < 60) return `${Math.round(minutes)} Min.`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} Std. ${String(Math.round(minutes % 60)).padStart(2, '0')} Min.`;
  return `${(minutes / 1440).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Tage`;
}

const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
export function standardDeviation(values) {
  if (values.length < 2) return null;
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1));
}

function summarizeGroup(key, label, items) {
  const r = items.map(item => item.netR).filter(Number.isFinite);
  const wins = items.filter(item => item.netProfit > 0);
  const losses = items.filter(item => item.netProfit < 0);
  const gains = wins.reduce((sum, item) => sum + item.netProfit, 0);
  const lost = Math.abs(losses.reduce((sum, item) => sum + item.netProfit, 0));
  const netPnL = items.reduce((sum, item) => sum + item.netProfit, 0);
  return {
    key, label, trades: items.length, wins: wins.length, losses: losses.length, netPnL,
    winRate: items.length ? wins.length / items.length * 100 : 0,
    avgR: mean(r), rCount: r.length, totalR: r.reduce((sum, value) => sum + value, 0),
    profitFactor: lost > 0 ? gains / lost : gains > 0 ? Infinity : null,
  };
}

export function groupBy(items, keyOf, labels = {}, order = null) {
  const map = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (key === null || key === undefined || key === '') continue;
    map.set(key, [...(map.get(key) || []), item]);
  }
  const groups = [...map.entries()].map(([key, rows]) => summarizeGroup(key, labels[key] || key, rows));
  return order ? groups.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)) : groups.sort((a, b) => b.netPnL - a.netPnL);
}

export function buildProBreakdowns(trades, balances = {}) {
  const items = buildProcessedTrades(trades, balances, balances);
  const sessionLabels = Object.fromEntries(sessions.map(s => [s.key, s.label]));
  const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
  return {
    items,
    side: groupBy(items, item => sideLabel(item.trade.side) === '—' ? null : sideLabel(item.trade.side), {}, ['Long', 'Short']),
    session: groupBy(items, item => sessionOf(item.trade.entryTime)?.key, sessionLabels, sessions.map(s => s.key)),
    hour: groupBy(items, item => String(item.trade.entryTime || '').slice(0, 2) || null, Object.fromEntries(hours.map(h => [h, `${h}:00`])), hours),
    grade: groupBy(items, item => item.trade.grade, { A: 'A-Setup', B: 'B-Setup', C: 'C-Setup' }, ['A', 'B', 'C']),
    emotion: groupBy(items, item => item.trade.emotion, emotionLabels, emotionOptions.map(([key]) => key)),
    confidence: groupBy(items, item => finite(item.trade.confidence) ? String(item.trade.confidence) : null, { 1: '1 – sehr unsicher', 2: '2', 3: '3 – neutral', 4: '4', 5: '5 – sehr sicher' }, ['1', '2', '3', '4', '5']),
  };
}

// Execution quality based on optional MAE/MFE/planned-R fields (all in R).
export function calculateExecutionStats(trades, balances = {}) {
  const items = buildProcessedTrades(trades, balances, balances);
  const holds = items.map(item => holdingMinutes(item.trade)).filter(Number.isFinite);
  const winnersHold = items.filter(item => item.netProfit > 0).map(item => holdingMinutes(item.trade)).filter(Number.isFinite);
  const losersHold = items.filter(item => item.netProfit < 0).map(item => holdingMinutes(item.trade)).filter(Number.isFinite);
  const mfeRows = items.filter(item => finite(item.trade.mfe) !== null);
  const maeRows = items.filter(item => finite(item.trade.mae) !== null);
  const captured = mfeRows.filter(item => Number(item.trade.mfe) > 0 && Number.isFinite(item.netR) && item.netR > 0).map(item => Math.min(1.5, item.netR / Number(item.trade.mfe)));
  const planned = items.filter(item => finite(item.trade.plannedRR) !== null && Number.isFinite(item.netR));
  const winnersPlanned = planned.filter(item => item.netProfit > 0);
  // Losers that first moved at least 1 R in favour: potential "gave back" trades.
  const gaveBack = mfeRows.filter(item => item.netProfit <= 0 && Number(item.trade.mfe) >= 1).length;
  const stoppedFull = maeRows.filter(item => Number(item.trade.mae) >= 1 && item.netProfit < 0).length;
  return {
    holdCount: holds.length, avgHold: mean(holds), avgHoldWin: mean(winnersHold), avgHoldLoss: mean(losersHold),
    mfeCount: mfeRows.length, maeCount: maeRows.length,
    avgMfe: mean(mfeRows.map(item => Number(item.trade.mfe))), avgMae: mean(maeRows.map(item => Number(item.trade.mae))),
    captureRatio: mean(captured), captureCount: captured.length, gaveBack, stoppedFull,
    plannedCount: planned.length, avgPlanned: mean(planned.map(item => Number(item.trade.plannedRR))), avgRealizedPlanned: mean(planned.map(item => item.netR)),
    targetHitRate: winnersPlanned.length ? winnersPlanned.filter(item => item.netR >= Number(item.trade.plannedRR) * 0.95).length / winnersPlanned.length * 100 : null,
    scatter: mfeRows.filter(item => Number.isFinite(item.netR)).map(item => ({ mfe: Number(item.trade.mfe), mae: finite(item.trade.mae), r: Number(item.netR.toFixed(2)), symbol: item.symbol, win: item.netProfit > 0 })),
  };
}

export function calculateDisciplineStats(trades) {
  const completed = trades.filter(t => t.reviewStatus === 'completed');
  const rated = key => completed.filter(t => ['yes', 'no'].includes(t[key]));
  const share = key => { const rows = rated(key); return rows.length ? rows.filter(t => t[key] === 'yes').length / rows.length * 100 : null; };
  const graded = trades.filter(t => ['A', 'B', 'C'].includes(t.grade));
  const emotional = trades.filter(t => t.emotion);
  return {
    reviewRate: trades.length ? completed.length / trades.length * 100 : null, completed: completed.length,
    setupAdherence: share('reviewSetup'), setupRated: rated('reviewSetup').length,
    riskAdherence: share('reviewRisk'), riskRated: rated('reviewRisk').length,
    aShare: graded.length ? graded.filter(t => t.grade === 'A').length / graded.length * 100 : null, graded: graded.length,
    tiltShare: emotional.length ? emotional.filter(t => ['fomo', 'greedy', 'frustrated'].includes(t.emotion)).length / emotional.length * 100 : null, emotional: emotional.length,
  };
}

export function summarizeMissedTrades(missed) {
  const valid = missed.filter(m => m.decision === 'valid');
  const errors = missed.filter(m => m.decision !== 'valid');
  const withR = list => list.map(m => finite(m.potentialR)).filter(value => value !== null);
  const reasons = missedReasonOptions.map(([key, label]) => {
    const rows = missed.filter(m => (m.reason || 'other') === key);
    const r = withR(rows);
    return { key, label, count: rows.length, totalR: r.reduce((s, v) => s + v, 0), rCount: r.length };
  }).filter(row => row.count).sort((a, b) => b.count - a.count);
  const missedR = withR(errors), avoidedR = withR(valid);
  return {
    total: missed.length, valid: valid.length, missed: errors.length,
    disciplineRate: missed.length ? valid.length / missed.length * 100 : null,
    opportunityR: missedR.reduce((s, v) => s + v, 0), opportunityCount: missedR.length,
    // Valid skips that would have lost are risk avoided by sticking to the rules.
    avoidedR: avoidedR.filter(v => v < 0).reduce((s, v) => s - v, 0),
    validWouldWinR: avoidedR.filter(v => v > 0).reduce((s, v) => s + v, 0),
    reasons,
    setups: groupMissedBy(missed, m => m.setup || 'Ohne Setup'),
  };
}

function groupMissedBy(missed, keyOf) {
  const map = new Map();
  for (const m of missed) {
    const key = keyOf(m);
    const row = map.get(key) || { key, count: 0, missed: 0, totalR: 0 };
    row.count++; if (m.decision !== 'valid') { row.missed++; row.totalR += finite(m.potentialR) || 0; }
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
