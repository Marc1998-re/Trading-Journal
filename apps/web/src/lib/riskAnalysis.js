import { reviewStatus } from './review.js';

export const riskSources = {
  stored: { label: 'Gespeichert', description: 'Ursprüngliches Geldrisiko im Trade hinterlegt. Ein manuell gespeicherter Wert ist nicht automatisch unabhängig geprüft.' },
  reconstructed: { label: 'Rekonstruiert', description: 'Aus Brutto-Ergebnis geteilt durch erfasstes Brutto-R abgeleitet. Die Verlässlichkeit hängt von diesen beiden Angaben ab.' },
  estimated: { label: 'Geschätzt', description: 'Aus hinterlegtem Kontostartkapital und Stop-Loss-Prozentsatz geschätzt. Das tatsächliche Risiko bei Eröffnung kann abweichen.' },
  missing: { label: 'Fehlend', description: 'Kein gültiges Geldrisiko vorhanden oder ableitbar. Der Trade bleibt im Euro-Ergebnis, wird aber nicht als 0 R gewertet.' },
};

export const riskScopes = {
  all: 'Alle verfügbaren Risikowerte',
  derived: 'Ohne Schätzungen',
  stored: 'Nur gespeichertes Risiko',
};

export function includesRisk(item, scope = 'all') {
  if (!Number.isFinite(item.netR)) return false;
  if (scope === 'stored') return item.riskSource === 'stored';
  if (scope === 'derived') return ['stored', 'reconstructed'].includes(item.riskSource);
  return item.riskSource !== 'missing';
}

function quantile(sorted, p) {
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * p;
  const lo = Math.floor(index), fraction = index - lo;
  return sorted[lo] * (1 - fraction) + sorted[Math.ceil(index)] * fraction;
}

function summarizeR(items, scope) {
  const values = items.filter(item => includesRisk(item, scope)).map(item => item.netR).sort((a, b) => a - b);
  return {
    values, count: values.length, total: items.length, excluded: items.length - values.length,
    mean: values.length ? values.reduce((sum, value) => sum + value / values.length, 0) : null,
    median: quantile(values, 0.5), q1: quantile(values, 0.25), q3: quantile(values, 0.75),
  };
}

export function summarizeRiskSources(items) {
  const counts = { stored: 0, reconstructed: 0, estimated: 0, missing: 0 };
  for (const item of items) counts[item.riskSource]++;
  return counts;
}

// Fixed, non-overlapping bins retain extreme outcomes in the two open tails.
export function buildRDistribution(items, scope = 'all') {
  const summary = summarizeR(items, scope);
  const bins = [
    { label: '< −2', range: 'Unter −2 R', color: 'destructive', accepts: r => r < -2 },
    { label: '−2…−1', range: 'Ab −2 bis unter −1 R', color: 'destructive', accepts: r => r >= -2 && r < -1 },
    { label: '−1…0', range: 'Ab −1 bis unter 0 R', color: 'destructive', accepts: r => r >= -1 && r < 0 },
    { label: '0', range: 'Genau 0 R nach erfassten Kosten', color: 'muted-foreground', accepts: r => r === 0 },
    { label: '0…1', range: 'Über 0 bis unter 1 R', color: 'success', accepts: r => r > 0 && r < 1 },
    { label: '1…2', range: 'Ab 1 bis unter 2 R', color: 'success', accepts: r => r >= 1 && r < 2 },
    { label: '2…3', range: 'Ab 2 bis unter 3 R', color: 'success', accepts: r => r >= 2 && r < 3 },
    { label: '≥ 3', range: 'Ab 3 R', color: 'success', accepts: r => r >= 3 },
  ].map(({ accepts, ...bin }) => ({ ...bin, count: summary.values.filter(accepts).length }));
  return { ...summary, bins };
}

export function buildRollingExpectancy(items, windowSize = 20, scope = 'all') {
  if (![20, 50].includes(windowSize)) throw new Error('Unsupported rolling window');
  const dated = items.filter(item => item.date instanceof Date && Number.isFinite(item.date.getTime())).sort((a, b) => a.date - b.date);
  const points = dated.map((item, index) => {
    // Slice before filtering R: missing values must never pull older trades into a window.
    const window = dated.slice(Math.max(0, index + 1 - windowSize), index + 1);
    const summary = summarizeR(window, scope);
    const complete = window.length === windowSize;
    return {
      tradeNumber: index + 1, dateLabel: item.date.toLocaleDateString('de-DE'),
      windowCount: window.length, rCount: summary.count, excluded: summary.excluded, complete,
      mean: complete ? summary.mean : null,
    };
  });
  return { points, excludedDates: items.length - dated.length, windowSize, latest: points.at(-1) || null };
}

export function buildReviewComparison(items, field = 'reviewSetup', scope = 'all') {
  if (!['reviewSetup', 'reviewRisk'].includes(field)) throw new Error('Unsupported review check');
  const completed = items.filter(item => reviewStatus(item.trade) === 'completed');
  const groups = [['yes', 'Eingehalten'], ['no', 'Nicht eingehalten'], ['', 'Nicht bewertet'], ['na', 'Nicht anwendbar']].map(([key, label]) => {
    const rows = completed.filter(item => {
      const raw = item.trade[field];
      return (['yes', 'no', 'na'].includes(raw) ? raw : '') === key;
    });
    const summary = summarizeR(rows, scope);
    return { key, label, trades: rows.length, rCount: summary.count, mean: summary.mean, median: summary.median, netPnL: rows.reduce((sum, item) => sum + item.netProfit, 0) };
  });
  return { groups, completed: completed.length, excluded: items.length - completed.length, total: items.length };
}
