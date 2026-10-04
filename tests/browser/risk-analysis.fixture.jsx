import React, { useState } from 'react';
import RiskAnalysis from '../../apps/web/src/components/journal/RiskAnalysis';
import TradeEditor from '../../apps/web/src/components/journal/TradeEditor';

const balances = { 'qa-a': 10000 };
const trades = Array.from({ length: 21 }, (_, i) => ({
  id: `risk-qa-${i}`, symbol: 'TEST', accountId: 'qa-a', profitLoss: (i % 3 - 1) * 100,
  entryDate: `2026-08-${String(i + 1).padStart(2, '0')}`, entryTime: '12:00',
  riskAmount: i % 4 === 0 ? 100 : 0,
  rrSecured: i % 4 === 1 ? (i % 3 - 1) || 1 : 0,
  stopLoss: i % 4 === 2 ? 1 : 0,
  reviewStatus: i < 18 ? 'completed' : 'draft',
  reviewSetup: ['yes', 'no', '', 'na'][i % 4], reviewRisk: 'yes',
}));

export default function RiskAnalysisFixture() {
  const [mode, setMode] = useState('mixed');
  const [editor, setEditor] = useState(false);
  const rows = mode === 'empty' ? [] : mode === 'missing' ? trades.map(t => ({ ...t, riskAmount: 0, rrSecured: 0, stopLoss: 0 })) : trades;
  return <div className="trading-app"><main className="journal-page">
    <h1 className="mb-4">R-Analyse Regressionstest</h1>
    <div className="flex flex-wrap gap-4 mb-8"><label>Testdaten<select value={mode} onChange={e => setMode(e.target.value)}><option value="mixed">Gemischt</option><option value="missing">Risiko fehlt</option><option value="empty">Leer</option></select></label><button onClick={() => setEditor(true)}>Legacy-Trade bearbeiten</button></div>
    <RiskAnalysis trades={rows} balances={balances} />
    {editor && <TradeEditor trade={{ ...trades[2], profitLoss: 50, rrSecured: 0, riskAmount: 0, stopLoss: 1 }} accounts={[{ id: 'qa-a', accountName: 'Testkonto A', startingBalance: 10000 }]} onSaved={() => {}} onClose={() => setEditor(false)} />}
  </main></div>;
}
