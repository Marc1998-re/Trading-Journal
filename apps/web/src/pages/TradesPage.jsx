import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useJournalData } from '@/hooks/useJournalData';
import { PageHeading, PeriodToolbar, DataState, SignedValue, IconButton } from '@/components/journal/JournalUI';
import TradeEditor from '@/components/journal/TradeEditor';
import { getTradeNetProfit,getTradeRiskBasis,getTradeDate } from '@/lib/tradeCalculations';
import RiskBasisLabel from '@/components/journal/RiskBasisLabel';
import { tradesToCsv } from '@/lib/tradeExport';
import { money,rValue } from '@/lib/format';
import pb from '@/lib/pocketbaseClient';
import { reviewStatus, reviewStatusLabels } from '@/lib/review';

export default function TradesPage(){
  const data=useJournalData();
  const [search,setSearch]=useState(''),[status,setStatus]=useState('all'),[page,setPage]=useState(1),[editor,setEditor]=useState(null),[deleting,setDeleting]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const rows=useMemo(()=>data.trades.filter(t=>{
    const net=getTradeNetProfit(t,data.balances,data.balances);
    return [t.symbol,t.setup,t.notes].join(' ').toLowerCase().includes(search.toLowerCase())&&(status==='all'||status==='win'&&net>0||status==='loss'&&net<0||status==='breakeven'&&net===0);
  }).sort((a,b)=>getTradeDate(b)-getTradeDate(a)),[data.trades,data.balances,search,status]);
  const pages=Math.max(1,Math.ceil(rows.length/20)),current=Math.min(page,pages),visible=rows.slice((current-1)*20,current*20);
  function download(){const url=URL.createObjectURL(new Blob([tradesToCsv(rows,data.balances)],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=(data.demo?'demo-':'')+'trading-journal.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function remove(){setBusy(true);setError('');try{await pb.collection('trades').delete(deleting.id);await data.refresh();setDeleting(null);}catch{setError('Löschen fehlgeschlagen. Dein Trade wurde nicht aus dieser Ansicht entfernt.');}finally{setBusy(false);}}
  return <div className="journal-page"><PageHeading eyebrow="Dokumentation" title="Trade-Journal" action={data.demo?<Button asChild><Link to="/signup">Eigenes Journal starten</Link></Button>:<Button onClick={()=>setEditor({})} disabled={!data.accounts.length}><Plus size={16} className="mr-2"/>Trade erfassen</Button>}>Deine Ausführungen. Manuell erfasst und nachvollziehbar.</PageHeading><PeriodToolbar data={data}/><DataState data={data}/>
    {!data.demo&&!data.accounts.length&&<div className="journal-empty mb-8"><h3>Dein erstes Handelskonto</h3><p>Lege zuerst ein Konto mit Anfangskapital an.</p><Button asChild variant="outline"><Link to="/settings">Konto anlegen</Link></Button></div>}
    <div className="trade-filters mb-6 flex flex-wrap items-center gap-3"><div className="relative min-w-0 flex-1 max-w-sm"><Search size={16} className="absolute left-3 top-3 text-muted-foreground"/><Input className="pl-9" aria-label="Trades durchsuchen" placeholder="Symbol, Setup oder Review suchen" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div><select aria-label="Trade-Ergebnis filtern" className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="all">Alle Ergebnisse</option><option value="win">Gewinn</option><option value="loss">Verlust</option><option value="breakeven">Break-even</option></select><Button variant="outline" onClick={download} disabled={!rows.length}><Download size={16} className="mr-2"/>CSV ({rows.length})</Button></div>
    <div className="journal-table-wrap trade-ledger" tabIndex={0} role="region" aria-label="Trade-Tabelle"><table className="journal-table"><thead><tr>{['Trade','Netto','Netto-R / Basis','Setup','Brutto','Gebühren','Review',''].map((h,i)=><th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{visible.map(t=>{const {amount:risk,source}=getTradeRiskBasis(t,data.balances,data.balances),net=getTradeNetProfit(t,data.balances,data.balances);return <tr key={t.id}><td className="min-w-36"><strong>{t.symbol}</strong><span className="sub">{getTradeDate(t)?.toLocaleDateString('de-DE')} · {t.entryTime}</span></td><td className="whitespace-nowrap"><SignedValue value={net}/></td><td className="whitespace-nowrap text-xs"><span className="block font-mono">{risk?rValue(net/risk):'—'}</span><RiskBasisLabel source={source}/></td><td className="min-w-36">{t.setup||'Nicht erfasst'}<span className="sub">{t.side||'—'}</span></td><td className="whitespace-nowrap font-mono text-xs">{money(t.profitLoss)}</td><td className="whitespace-nowrap font-mono text-xs">{money(Number(t.profitLoss)-net)}</td><td><Link className="text-xs text-primary hover:underline" to={(data.demo?'/demo':'')+'/review?trade='+t.id}>{reviewStatusLabels[reviewStatus(t)]}</Link></td><td>{!data.demo&&<div className="flex"><IconButton label="Trade bearbeiten" onClick={()=>setEditor(t)}><Pencil size={15}/></IconButton><IconButton label="Trade löschen" onClick={()=>setDeleting(t)}><Trash2 size={15}/></IconButton></div>}</td></tr>;})}</tbody></table></div>
    {!rows.length&&!data.loading&&<div className="journal-empty my-8"><h3>Keine Trades in dieser Auswahl</h3><p>Wähle einen anderen Zeitraum oder passe deine Filter an.</p></div>}
    <div className="flex justify-between items-center py-5 text-xs text-muted-foreground"><span>{rows.length} Trades · Seite {current} von {pages}</span><div className="flex"><IconButton label="Vorherige Seite" disabled={current===1} onClick={()=>setPage(current-1)}><ChevronLeft/></IconButton><IconButton label="Nächste Seite" disabled={current===pages} onClick={()=>setPage(current+1)}><ChevronRight/></IconButton></div></div>
    {editor&&!data.demo&&<TradeEditor trade={editor.id?editor:null} accounts={data.accounts} onClose={()=>setEditor(null)} onSaved={data.refresh}/>}
    {deleting&&<Dialog open onOpenChange={open=>!open&&!busy&&setDeleting(null)}><DialogContent><DialogTitle>Trade endgültig löschen?</DialogTitle><DialogDescription>{deleting.symbol} · Diese Aktion entfernt auch deinen zugehörigen Review.</DialogDescription>{error&&<p role="alert">{error}</p>}<div className="flex justify-end gap-3"><Button variant="outline" disabled={busy} onClick={()=>setDeleting(null)}>Abbrechen</Button><Button variant="destructive" disabled={busy} onClick={remove}>{busy?'Wird gelöscht…':'Endgültig löschen'}</Button></div></DialogContent></Dialog>}
  </div>;
}
