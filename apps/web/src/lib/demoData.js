// Fictional data; review edits live only in the current demo session, never in PocketBase.
export const demoAccounts = [{ id:'demo-account', accountName:'Demo-Challenge 10k', startingBalance:10000, accountType:'prop', propFirm:'Beispiel-Prop-Firm · Phase 1', dailyLossLimit:500, maxLoss:1000, drawdownMode:'static', profitTarget:1000, maxRiskPerTrade:1.5, maxTradesPerDay:3 }];
const outcomes = [2.1,-1,1.4,0,2.7,-1,0.8,-1,1.9,2.4,-1,0.6];
const symbols = ['EUR/USD','NAS100','XAU/USD','GBP/USD'];
const setups = ['London Breakout','Trend-Pullback','Range Reversal'];
export const demoTrades = Array.from({length:60},(_,i)=>{
  const current = i >= 12;
  const j = current ? i-12 : i;
  const day = current ? 3+Math.floor(j/2)+Math.floor(j/10) : 6+j;
  const riskAmount = i%3===0 ? 150 : 100;
  const rrSecured = outcomes[i%outcomes.length];
  return {id:`demo-${String(i).padStart(3,'0')}`,userId:'demo',accountId:'demo-account',symbol:symbols[i%4],
    entryDate:`2026-${current?'08':'07'}-${String(Math.min(31,day)).padStart(2,'0')} 12:00:00.000Z`,
    entryTime:i%2===0?'09:30':'15:45',profitLoss:riskAmount*rrSecured,riskAmount,stopLoss:riskAmount/100,
    rrSecured,fees:4,commissionPercentage:0,setup:setups[i%3],side:i%2?'Short':'Long',
    status:rrSecured>0?'Win':rrSecured<0?'Loss':'Breakeven',
    notes:i%5===0?'':rrSecured>0?'Einstieg nach Bestätigung. Geplantes Risiko eingehalten.':'Ausgangslage dokumentiert. Im Review prüfen, ob der Einstieg zu früh war.',
    reviewStatus: i % 5 === 0 ? '' : i % 3 === 0 ? 'draft' : 'completed',
    reviewSetup: i % 5 === 0 ? '' : i % 4 === 0 ? 'no' : 'yes',
    reviewRisk: i % 5 === 0 ? '' : 'yes',
    reviewTags: i % 5 === 0 ? [] : i % 4 === 0 ? ['early'] : ['plan', 'patience'],
    reviewLesson: i % 5 === 0 ? '' : i % 4 === 0 ? 'Der Einstieg vor dem bestätigten Signal war nicht Teil meines Plans.' : 'Das Warten auf die Bestätigung hat eine klare Entscheidung ermöglicht.',
    reviewAction: i % 5 === 0 ? '' : i % 4 === 0 ? 'Vor dem Einstieg alle drei Bedingungen meiner Checkliste prüfen.' : 'Den geplanten Einstieg und das maximale Risiko vor der Order notieren.',
    reviewCompletedAt: i % 5 !== 0 && i % 3 !== 0 ? `2026-${current?'08':'07'}-${String(Math.min(31,day)).padStart(2,'0')}T18:00:00Z` : '',
    contextUrl:'',entryUrl:'',validationUrl:'',
    ...proFields(i, rrSecured, current, day)};
});

function proFields(i, r, current, day) {
  const entryHour = i % 2 === 0 ? 9 : 15;
  const minutes = [25, 70, 140, 45, 210, 35, 95][i % 7];
  const exit = entryHour * 60 + (i % 2 === 0 ? 30 : 45) + minutes;
  const grade = r >= 1.9 ? 'A' : r < 0 && i % 3 !== 1 ? 'C' : 'B';
  const emotion = r < 0 ? ['fomo', 'frustrated', 'fearful', 'calm'][i % 4] : r === 0 ? 'bored' : r > 2 ? 'calm' : ['confident', 'calm', 'confident'][i % 3];
  return {
    exitDate: `2026-${current ? '08' : '07'}-${String(Math.min(31, day)).padStart(2, '0')}`,
    exitTime: `${String(Math.floor(exit / 60)).padStart(2, '0')}:${String(exit % 60).padStart(2, '0')}`,
    plannedRR: [2, 2.5, 3][i % 3],
    mfe: r > 0 ? Number((r + [0.3, 0.8, 0.1, 1.2][i % 4]).toFixed(1)) : [0.4, 1.3, 0.2, 0.7][i % 4],
    mae: r < 0 ? 1 : [0.2, 0.5, 0.1, 0.8][i % 4],
    grade, emotion, confidence: grade === 'A' ? 5 : grade === 'B' ? [3, 4][i % 2] : 2,
  };
}

const missedReasons = ['hesitation', 'rules', 'news', 'fear', 'risk_limit', 'absent', 'rules', 'hesitation', 'conditions', 'fear'];
// Fictional setups that were seen but not traded, with their hypothetical outcome in R.
export const demoMissedTrades = Array.from({ length: 14 }, (_, i) => {
  const reason = missedReasons[i % missedReasons.length];
  const valid = ['rules', 'news', 'risk_limit', 'conditions'].includes(reason);
  return {
    id: `demo-missed-${String(i).padStart(2, '0')}`, userId: 'demo', accountId: 'demo-account',
    symbol: symbols[(i + 1) % 4], entryDate: `2026-08-${String(4 + i * 2).padStart(2, '0')}`, entryTime: i % 2 ? '15:40' : '10:05',
    setup: setups[i % 3], side: i % 3 ? 'long' : 'short', grade: valid ? 'C' : i % 2 ? 'A' : 'B',
    decision: valid ? 'valid' : 'missed', reason,
    potentialR: valid ? [-1, 0.6, -1, 1.2][i % 4] : [2.4, 1.6, -1, 3.1, 1.1][i % 5],
    notes: valid ? 'Kriterien nicht vollständig erfüllt – korrekt ausgelassen.' : 'Setup war klar, aber ich habe den Einstieg nicht ausgeführt.',
    contextUrl: '', validationUrl: '', entryUrl: '',
  };
});
