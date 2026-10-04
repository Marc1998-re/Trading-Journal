import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Routes, Route, Link } from 'react-router-dom';
import { NavigationGuardProvider } from '../../apps/web/src/contexts/NavigationGuardContext';
import { AccountProvider, useAccount } from '../../apps/web/src/contexts/AccountContext';
import { JournalPeriodProvider } from '../../apps/web/src/contexts/JournalPeriodContext';
import ReviewPage from '../../apps/web/src/pages/ReviewPage';
import RiskAnalysisFixture from './risk-analysis.fixture';
import { Toaster } from '../../apps/web/src/components/ui/sonner';
import { setFailure, setHold, release, writes } from './pocketbase.fixture';
import '../../apps/web/src/index.css';

function Controls() {
  const { selectAccount, selectedAccountId } = useAccount();
  const [log, setLog] = useState('');
  return <header className="border-b p-4 space-y-3">
    <strong>Lokaler Regressionstest · ausschließlich fiktive Daten</strong>
    <nav className="flex flex-wrap gap-4"><Link to="/review-test.html?trade=qa-one">Trade ONE öffnen</Link><Link to="/review-test.html?trade=qa-two">Trade TWO öffnen</Link><Link to="/review-test-other.html">Andere Seite</Link></nav>
    <div className="flex flex-wrap gap-4">
      <button onClick={() => selectAccount('qa-a')}>Testkonto A wählen</button>
      <button onClick={() => selectAccount('qa-b')}>Testkonto B wählen</button>
      <span>Kontofilter: {selectedAccountId || 'alle'}</span>
      <label><input type="checkbox" onChange={e => setFailure(e.target.checked)} /> Speichern fehlschlagen lassen</label>
      <label><input type="checkbox" onChange={e => setHold(e.target.checked)} /> Speichern verzögern</label>
      <button onClick={release}>Antwort freigeben</button>
      <button onClick={() => setLog(JSON.stringify(writes))}>Speicherprotokoll anzeigen</button>
    </div>
    <output>{log}</output>
  </header>;
}

function Fixture() {
  return <NavigationGuardProvider><AccountProvider><JournalPeriodProvider><Controls /><Routes>
    <Route path="/review-test.html" element={<ReviewPage />} />
    <Route path="/analysis-test.html" element={<RiskAnalysisFixture />} />
    <Route path="/review-test-other.html" element={<h1>Andere Testseite</h1>} />
  </Routes><Toaster /></JournalPeriodProvider></AccountProvider></NavigationGuardProvider>;
}

const router = createBrowserRouter([{ path: '*', element: <Fixture /> }], { basename: '/review-tests' });
createRoot(document.getElementById('root')).render(<React.StrictMode><RouterProvider router={router} /></React.StrictMode>);
