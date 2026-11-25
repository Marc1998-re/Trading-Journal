// Edge finder: which recurring patterns cost the most, and which ones carry the result.
// Every finding is a plain what-if on recorded, closed trades. Findings overlap and are not additive.
import { buildProcessedTrades, dayKey } from './tradeCalculations.js';
import { sessions, sessionOf, emotionLabels, sideLabel } from './proJournal.js';

export const MIN_SAMPLE = 5;
const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const sessionLabels = Object.fromEntries(sessions.map(s => [s.key, s.label]));

function summarize(rows) {
  const r = rows.map(row => row.netR).filter(Number.isFinite);
  const netPnL = rows.reduce((sum, row) => sum + row.netProfit, 0);
  const wins = rows.filter(row => row.netProfit > 0).length;
  return {
    trades: rows.length, netPnL, wins, winRate: rows.length ? wins / rows.length * 100 : 0,
    totalR: r.reduce((sum, value) => sum + value, 0), rCount: r.length,
    avgR: r.length ? r.reduce((sum, value) => sum + value, 0) / r.length : null,
    avgPnL: rows.length ? netPnL / rows.length : 0,
  };
}

const advice = {
  overtrading: f => `Nach ${f.key} Trades am Tag aufhören.`,
  afterLoss: () => 'Nach einem Verlust eine feste Pause einlegen, bevor du wieder einsteigst.',
  setup: () => 'Setup pausieren oder die Kriterien verschärfen, bis sich die Zahlen drehen.',
  symbol: () => 'Markt pausieren oder die Positionsgröße halbieren.',
  weekday: () => 'An diesem Tag nur A-Setups handeln oder aussetzen.',
  session: () => 'In dieser Session nur A-Setups handeln oder aussetzen.',
  side: () => 'Diese Richtung nur mit dem übergeordneten Trend handeln.',
  grade: f => f.key === 'C' ? 'C-Setups konsequent auslassen.' : 'Kriterien schärfen: Was fehlt diesen Trades zum A-Setup?',
  emotion: () => 'In diesem Zustand keinen Trade eröffnen. Erst Pause, dann Checkliste.',
  setupBreak: () => 'Vor jedem Einstieg die Checkliste vollständig abhaken.',
  riskBreak: () => 'Positionsgröße vor der Order berechnen und nicht mehr anpassen.',
  bigRisk: () => 'Feste Positionsgröße verwenden. Mehr Risiko hat sich bisher nicht ausgezahlt.',
};

/**
 * @returns {{ total: object, leaks: object[], strengths: object[], enough: boolean }}
 * leaks: groups with a negative net result, largest loss first.
 * strengths: groups that earn clearly more per trade than the average, largest surplus first.
 */
export function findEdges(trades, balances = {}, { minSample = MIN_SAMPLE } = {}) {
  const items = buildProcessedTrades(trades, balances, balances).filter(item => item.date);
  const total = summarize(items);
  const findings = [];
  const add = (kind, key, title, rows, special = false) => {
    if (rows.length < minSample || rows.length >= items.length) return;
    const s = summarize(rows);
    findings.push({
      kind, key, title, special, ...s, share: rows.length / items.length * 100,
      withoutPnL: total.netPnL - s.netPnL, withoutR: total.totalR - s.totalR,
      sample: rows.length >= 30 ? 'solid' : rows.length >= 12 ? 'medium' : 'small',
    });
  };
  const group = (kind, keyOf, titleOf) => {
    const map = new Map();
    for (const item of items) {
      const key = keyOf(item);
      if (key === null || key === undefined || key === '') continue;
      map.set(key, [...(map.get(key) || []), item]);
    }
    for (const [key, rows] of map) add(kind, key, titleOf(key), rows);
  };

  group('setup', item => item.trade.setup, key => `Setup „${key}“`);
  group('symbol', item => item.symbol, key => `Markt ${key}`);
  group('weekday', item => weekdays[(item.date.getDay() + 6) % 7], key => `Trades am ${key}`);
  group('session', item => sessionOf(item.trade.entryTime)?.key, key => `${sessionLabels[key]}-Session`);
  group('side', item => sideLabel(item.trade.side) === '—' ? null : sideLabel(item.trade.side), key => `${key}-Trades`);
  group('grade', item => ['A', 'B', 'C'].includes(item.trade.grade) ? item.trade.grade : null, key => `${key}-Setups`);
  group('emotion', item => item.trade.emotion, key => `Zustand: ${emotionLabels[key] || key}`);

  // Position of each trade within its day and the result of the trade before it.
  const perDay = new Map();
  for (const item of items) { const key = dayKey(item.date); perDay.set(key, [...(perDay.get(key) || []), item]); }
  const position = new Map(), afterLoss = [];
  for (const rows of perDay.values()) rows.forEach((item, index) => {
    position.set(item, index);
    if (index > 0 && rows[index - 1].netProfit < 0) afterLoss.push(item);
  });
  let worstLate = null;
  for (let limit = 1; limit <= 6; limit++) {
    const rows = items.filter(item => position.get(item) >= limit);
    if (rows.length < minSample) break;
    const net = rows.reduce((sum, row) => sum + row.netProfit, 0);
    if (!worstLate || net < worstLate.net) worstLate = { limit, rows, net };
  }
  if (worstLate) add('overtrading', worstLate.limit, `Ab dem ${worstLate.limit + 1}. Trade am Tag`, worstLate.rows, true);
  add('afterLoss', 'afterLoss', 'Direkt nach einem Verlust', afterLoss, true);
  add('setupBreak', 'setupBreak', 'Setup-Regeln nicht eingehalten', items.filter(item => item.trade.reviewSetup === 'no'), true);
  add('riskBreak', 'riskBreak', 'Geplantes Risiko nicht eingehalten', items.filter(item => item.trade.reviewRisk === 'no'), true);
  const risks = items.map(item => item.stopLossAmount).filter(value => value > 0).sort((a, b) => a - b);
  if (risks.length >= minSample * 2) {
    const median = risks[Math.floor(risks.length / 2)];
    add('bigRisk', 'bigRisk', 'Trades mit erhöhtem Risiko', items.filter(item => item.stopLossAmount > median * 1.5), true);
  }

  const leaks = findings.filter(f => f.netPnL < 0).sort((a, b) => a.netPnL - b.netPnL)
    .map(f => ({ ...f, advice: advice[f.kind](f) }));
  const strengths = findings.filter(f => !f.special && f.netPnL > 0 && f.avgPnL > total.avgPnL * 1.25 && f.avgPnL > 0)
    .map(f => ({ ...f, surplus: (f.avgPnL - total.avgPnL) * f.trades, advice: 'Hier liegt dein Vorteil. Gib diesen Trades Vorrang.' }))
    .sort((a, b) => b.surplus - a.surplus);
  return { total, leaks, strengths, enough: items.length >= minSample * 2 };
}

/** The most important findings, at most one per kind so the list does not repeat one cause. */
export function pickDiverse(findings, limit = 3) {
  const seen = new Set(), picked = [];
  for (const finding of findings) {
    if (seen.has(finding.kind)) continue;
    seen.add(finding.kind); picked.push(finding);
    if (picked.length === limit) break;
  }
  return picked;
}
