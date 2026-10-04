import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { money, rValue } from '@/lib/format';
import { dayKey, getTradeRiskBasis } from '@/lib/tradeCalculations';
import { riskSources } from '@/lib/riskAnalysis';

export default function TradeEditor({trade,accounts,onClose,onSaved}) {
  const {currentUser,userSettings}=useAuth();
  const balances=Object.fromEntries(accounts.map(a=>[a.id,a.startingBalance]));
  const riskBasis=getTradeRiskBasis(trade,balances,balances);
  const [form,setForm]=useState({accountId:trade?.accountId||accounts[0]?.id||'',symbol:trade?.symbol||'',entryDate:trade?.entryDate?.slice(0,10)||dayKey(new Date()),entryTime:trade?.entryTime||'12:00',setup:trade?.setup||'',side:trade?.side||'',riskAmount:riskBasis.source==='stored'?riskBasis.amount:'',profitLoss:trade?.profitLoss??'',fees:trade?.fees??0,commissionPercentage:trade?.commissionPercentage??0,notes:trade?.notes||'',contextUrl:trade?.contextUrl||''});
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const set=(key,value)=>setForm(f=>({...f,[key]:value}));
  const gross=Number(form.profitLoss)||0,risk=Number(form.riskAmount)||0,net=gross-Number(form.fees)-Math.max(0,gross)*Number(form.commissionPercentage)/100;
  const field=(key,label,props={})=><label className="form-field">{label}<Input value={form[key]} onChange={e=>set(key,e.target.value)} {...props}/></label>;
  async function save(e) {
    e.preventDefault();setError('');
    if(!Number.isFinite(risk)||risk<=0||!form.accountId||!Number.isFinite(net))return setError('Bitte wähle ein Konto und erfasse gültige Werte. Das ursprüngliche Risiko muss größer als null sein.');
    setBusy(true);
    try {
      const account=accounts.find(a=>a.id===form.accountId);
      const payload={...form,userId:currentUser.id,symbol:form.symbol.trim().toUpperCase(),setup:form.setup.trim(),riskAmount:risk,profitLoss:gross,fees:Number(form.fees),commissionPercentage:Number(form.commissionPercentage),rrSecured:gross/risk,stopLoss:trade?.stopLoss||((risk/Number(account?.startingBalance))*100)||0,date:form.entryDate,status:net>0?'Win':net<0?'Loss':'Breakeven'};
      if(trade)await pb.collection('trades').update(trade.id,payload);else await pb.collection('trades').create(payload);
      await onSaved();onClose();
    }catch(e){setError(e.response?.message||'Der Trade konnte nicht gespeichert werden. Bitte erneut versuchen.');}finally{setBusy(false);}
  }
  return <Dialog open onOpenChange={open=>!open&&!busy&&onClose()}><DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto"><DialogTitle>{trade?'Trade bearbeiten':'Abgeschlossenen Trade erfassen'}</DialogTitle><DialogDescription>EUR · Risiko bei Eröffnung · tatsächlich realisiertes Ergebnis. Zeitraum und Reihenfolge richten sich nach dem Einstieg, nicht nach dem Abschluss.</DialogDescription><form onSubmit={save} className="space-y-5">
    <div className="field-grid"><label className="form-field">Konto<select required className="h-10 rounded-md border bg-background px-3" value={form.accountId} onChange={e=>set('accountId',e.target.value)}><option value="">Konto auswählen</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.accountName}</option>)}</select></label>{field('symbol','Symbol',{required:true,maxLength:30,placeholder:'EUR/USD'})}{field('entryDate','Einstiegsdatum',{type:'date',required:true})}{field('entryTime','Einstiegszeit',{type:'time',required:true})}{field('setup','Setup',{maxLength:80,placeholder:'z. B. London Breakout'})}<label className="form-field">Richtung<select className="h-10 rounded-md border bg-background px-3" value={form.side} onChange={e=>set('side',e.target.value)}><option value="">Nicht erfasst</option><option value="long">Long</option><option value="short">Short</option></select></label>{field('riskAmount','Ursprüngliches Risiko (€)',{type:'number',min:0.01,step:'any',required:true})}{field('profitLoss','Realisiertes Brutto-Ergebnis (€)',{type:'number',step:'any',required:true})}{field('fees','Ordergebühren & Swap (€)',{type:'number',min:0,step:'any',required:true})}{field('commissionPercentage','Gewinnbeteiligung (%)',{type:'number',min:0,max:100,step:'any'})}</div>
    {trade&&riskBasis.source!=='stored'&&<p className="border-l-2 border-info pl-3 text-xs leading-5 text-muted-foreground">Bisherige Risikobasis: {riskSources[riskBasis.source].label}{riskBasis.amount!==null?` (${money(riskBasis.amount)})`:''}. Bitte erfasse vor dem Speichern das tatsächliche ursprüngliche Geldrisiko. Abgeleitete Werte werden nicht automatisch als gespeichertes Risiko übernommen.</p>}
    <div className="trade-preview"><div><span>Netto-Ergebnis</span><strong>{money(net,true)}</strong></div><div><span>Risiko</span><strong>{risk>0?money(risk):'—'}</strong></div><div><span>Netto-R</span><strong>{risk>0?rValue(net/risk):'—'}</strong></div></div>
    {field('contextUrl','Chart-Link',{type:'url',placeholder:'https://…'})}
    <label className="form-field">Notiz<Textarea value={form.notes} maxLength={5000} rows={4} onChange={e=>set('notes',e.target.value)} placeholder="Was war geplant? Was ist passiert? Was nehme ich mit?"/></label>
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Abbrechen</Button><Button disabled={busy||!accounts.length}><Save size={16} className="mr-2"/>{busy?'Wird gespeichert…':'Trade speichern'}</Button></div>
  </form></DialogContent></Dialog>;
}
