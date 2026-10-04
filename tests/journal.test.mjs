import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {getTradeGrossProfit,getTradeNetProfit,getTradeRiskAmount,getTradeDate,calculateAdvancedStats,buildEquitySeries,buildSetupPerformance,calculateWinRate,winRateInterval,calculateReturnPercentage,calculateNetPnL} from '../apps/web/src/lib/tradeCalculations.js';
import {percent} from '../apps/web/src/lib/format.js';
import {tradesToCsv} from '../apps/web/src/lib/tradeExport.js';
const require=createRequire(import.meta.url);
const mail=require('../apps/pocketbase/pb_hooks/journal-mail.cjs');
const trade=(p,extra={})=>({profitLoss:p,riskAmount:100,entryDate:'2026-08-01',entryTime:'12:00',fees:0,...extra});
test('historical results do not change with account capital, including zero',()=>{assert.equal(getTradeGrossProfit(trade(0,{accountId:'a',rrSecured:2}),{a:10000},{a:20000}),0);assert.equal(getTradeGrossProfit(trade(200,{accountId:'a'}),{a:10000},{a:20000}),200);});
test('fees apply to losses, profit share only to gains',()=>{assert.equal(getTradeNetProfit(trade(-100,{fees:4,commissionPercentage:10})),-104);assert.equal(getTradeNetProfit(trade(200,{fees:4,commissionPercentage:10})),176);assert.equal(getTradeNetProfit(trade(0,{fees:4})),-4);});
test('net profitability determines wins even below one R',()=>{assert.equal(calculateWinRate([trade(50),trade(1,{fees:2})]),50);});
test('R expectancy uses net results and only known risks',()=>{const stats=calculateAdvancedStats([trade(200,{fees:4}),trade(-100,{fees:4}),trade(10,{riskAmount:0})]);assert.equal(stats.rSampleSize,2);assert.ok(Math.abs(stats.expectancyR-.46)<1e-10);assert.equal(stats.netPnL,102);});
test('old risk is reconstructed without changing realized profits',()=>{assert.equal(getTradeRiskAmount(trade(200,{riskAmount:0,rrSecured:2})),100);assert.equal(getTradeRiskAmount(trade(0,{riskAmount:0})),null);});
test('drawdown includes loss from opening capital',()=>{const s=calculateAdvancedStats([trade(-100),trade(200,{entryTime:'13:00'}),trade(-220,{entryTime:'14:00'})],1000);assert.equal(s.maxDrawdown,220);assert.equal(s.maxDrawdownPct,20);assert.equal(s.endingBalance,880);});
test('all-winning worst trade is not falsely zero',()=>{assert.equal(calculateAdvancedStats([trade(100),trade(50)]).worstTrade,50);});
test('intraday time defines capital sequence',()=>{const s=buildEquitySeries([trade(200,{entryTime:'15:00'}),trade(-100,{entryTime:'09:00'})],1000);assert.equal(s[1].balance,900);});
test('invalid calendar dates are rejected',()=>{assert.equal(getTradeDate(trade(1,{entryDate:'2026-02-31'})),null);assert.equal(getTradeDate(trade(1,{entryTime:'25:10'})),null);});
test('setup aggregates agree with total net',()=>{const ts=[trade(100,{setup:'A'}),trade(-20,{setup:'B'})];assert.equal(buildSetupPerformance(ts).reduce((s,g)=>s+g.netPnL,0),80);});
test('empty stats remain usable and Wilson interval expresses uncertainty',()=>{assert.equal(calculateAdvancedStats([]).totalTrades,0);assert.equal(winRateInterval(0,0),null);assert.ok(winRateInterval(1,1).lower<25);});
test('period return uses net results including fees and profit sharing',()=>{
  const trades=[trade(200,{fees:4,commissionPercentage:10}),trade(-100,{fees:4,entryTime:'13:00'})];
  const stats=calculateAdvancedStats(trades,1000);
  const series=buildEquitySeries(trades,1000);
  assert.equal(stats.netPnL,72);
  assert.ok(Math.abs(stats.returnPct-7.2)<1e-10);
  assert.equal(series[0].returnPct,0);
  assert.equal(series.at(-1).returnPct,stats.returnPct);
  assert.ok(Math.abs(series[1].returnPct-17.6)<1e-10);
});
test('monthly returns rebase on period opening rather than initial or ending balance',()=>{
  const before=[trade(1000,{entryDate:'2026-07-01'})];
  const current=[trade(550)];
  const opening=10000+calculateNetPnL(before);
  const stats=calculateAdvancedStats(current,opening);
  assert.equal(stats.returnPct,5);
  assert.equal(buildEquitySeries(current,opening).at(-1).returnPct,5);
  assert.equal(calculateAdvancedStats([...before,...current],10000).returnPct,15.5);
});
test('combined accounts use aggregate capital rather than averaging account returns',()=>{
  const stats=calculateAdvancedStats([trade(100,{accountId:'a'}),trade(-100,{accountId:'b',entryTime:'13:00'})],11000,{a:1000,b:10000});
  assert.equal(stats.returnPct,0);
  assert.equal(calculateReturnPercentage(100,1000),10);
  assert.equal(calculateReturnPercentage(-100,10000),-1);
});
test('returns retain losses, breakeven and sub-cent precision without compounding twice',()=>{
  assert.equal(calculateReturnPercentage(-100,1000),-10);
  assert.equal(calculateReturnPercentage(0,1000),0);
  assert.equal(calculateReturnPercentage(-1200,1000),-120);
  const trades=[trade(0.004),trade(0.004,{entryTime:'13:00'})];
  assert.equal(buildEquitySeries(trades,100).at(-1).returnPct,calculateAdvancedStats(trades,100).returnPct);
  assert.equal(calculateAdvancedStats([trade(100),trade(110,{entryTime:'13:00'})],1000).returnPct,21);
});
test('missing or non-positive period capital never becomes a misleading zero or infinite return',()=>{
  for(const opening of [0,-100,null,NaN,Infinity,'','not-a-number']) {
    assert.equal(calculateReturnPercentage(100,opening),null);
    assert.equal(calculateAdvancedStats([trade(100)],opening).returnPct,null);
    assert.ok(buildEquitySeries([trade(100)],opening).every(point=>point.returnPct===null));
    assert.equal(calculateAdvancedStats([],opening).returnPct,null);
  }
  for(const pnl of [null,undefined,NaN,Infinity,'',false]) assert.equal(calculateReturnPercentage(pnl,1000),null);
  assert.equal(calculateReturnPercentage(100,undefined),null);
  assert.equal(calculateAdvancedStats([],1000).returnPct,0);
  assert.deepEqual(buildEquitySeries([],1000).map(p=>p.returnPct),[0]);
});
test('German return formatting shows signs, precision and unavailable values consistently',()=>{
  const normalized=value=>value.replace(/\s/g,' ');
  assert.equal(normalized(percent(5,{digits:2,sign:true})),'+5,00 %');
  assert.equal(normalized(percent(-5,{digits:2,sign:true})),'-5,00 %');
  assert.equal(normalized(percent(0,{digits:2,sign:true})),'0,00 %');
  assert.equal(normalized(percent(58.333)),'58,3 %');
  for(const value of [null,undefined,NaN,Infinity]) assert.equal(percent(value),'—');
});
test('CSV has all 1001 rows and protects spreadsheet formulas',()=>{const csv=tradesToCsv(Array.from({length:1001},()=>trade(-100,{symbol:'=HYPERLINK("x")',notes:'line 1\nline 2'})));assert.equal((csv.match(/HYPERLINK/g)||[]).length,1001);assert.ok(csv.includes('"\'=HYPERLINK(""x"")"'));assert.ok(csv.includes('"-100"'));});
test('email uses actual token, correct route and escaped content',()=>{const e={app:{settings:()=>({meta:{appUrl:'https://journal.example'}})},record:{email:()=>'<injected>@test.example'},meta:{token:'signed-token+/='},message:{from:{address:'verified@example.com'}}};mail.customize(e,'verification');assert.ok(e.message.html.includes('/verify-pending?token=signed-token%2B%2F%3D'));assert.ok(!e.message.html.includes('<injected>'));assert.equal(e.message.from.address,'verified@example.com');assert.ok(e.message.text.includes('signed-token%2B%2F%3D'));});
test('mail rejects unsafe origin and missing token',()=>{const e={app:{settings:()=>({meta:{appUrl:'javascript:bad'}})},meta:{},message:{from:{}}};assert.throws(()=>mail.customize(e,'verification'));});
test('reset mail points to reset route',()=>{const e={app:{settings:()=>({meta:{appUrl:'https://journal.example'}})},meta:{token:'token'},record:{email:()=> 'test@example.com'},message:{from:{}}};mail.customize(e,'reset');assert.ok(e.message.html.includes('/reset-password?token=token'));});
test('verification hooks work when executed in an isolated PocketBase context',()=>{const handlers=[];vm.runInNewContext(readFileSync(new URL('../apps/pocketbase/pb_hooks/send-verification-email.pb.js',import.meta.url),'utf8'),{onMailerRecordVerificationSend:fn=>handlers.push(fn.toString()),onMailerRecordPasswordResetSend:fn=>handlers.push(fn.toString())});let next=0;const e={app:{settings:()=>({meta:{appUrl:'https://journal.example'}})},record:{email:()=> 'a@example.com'},meta:{token:'real-token'},message:{from:{}},next:()=>next++};for(const handler of handlers)vm.runInNewContext('('+handler+')(e)',{e,require:()=>mail,__hooks:'/hooks',$os:{getenv:()=>''}});assert.equal(next,2);});
