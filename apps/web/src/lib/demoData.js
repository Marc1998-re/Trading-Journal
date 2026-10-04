// Fictional data; review edits live only in the current demo session, never in PocketBase.
export const demoAccounts = [{ id:'demo-account', accountName:'Demokonto', startingBalance:10000 }];
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
    contextUrl:'',entryUrl:'',validationUrl:''};
});
