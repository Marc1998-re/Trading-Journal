import { getTradeNetProfit, getTradeRiskBasis, getTradeFees } from './tradeCalculations.js';
import { reviewStatus, reviewStatusLabels } from './review.js';
import { riskSources } from './riskAnalysis.js';

function cell(value) {
  let text = String(value ?? '');
  if (typeof value !== 'number' && /^[\s]*[=+@\-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function tradesToCsv(trades, balances = {}) {
  const headers = ['Einstiegsdatum','Einstiegszeit','Symbol','Setup','Richtung','Brutto EUR','Gebühren EUR','Netto EUR','Risiko EUR','Netto R','Review','Review-Status','Setup eingehalten','Risiko eingehalten','Lern-Tags','Erkenntnis','Nächster Schritt','Review abgeschlossen am','Risikobasis'];
  return '\uFEFF' + [headers, ...trades.map(t => {
    const { amount: risk, source } = getTradeRiskBasis(t, balances, balances);
    const net = getTradeNetProfit(t, balances, balances);
    return [t.entryDate,t.entryTime,t.symbol,t.setup,t.side,t.profitLoss,getTradeFees(t,balances,balances),net,risk,risk ? net/risk : '',t.notes,reviewStatusLabels[reviewStatus(t)],t.reviewSetup,t.reviewRisk,(t.reviewTags || []).join(', '),t.reviewLesson,t.reviewAction,t.reviewCompletedAt,riskSources[source].label];
  })].map(row => row.map(cell).join(';')).join('\r\n');
}
