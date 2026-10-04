import React, { useState } from 'react';
import { addDays } from 'date-fns';
import { CalendarRange, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { dateInput, periodBounds, periodLabel } from '@/lib/journalPeriod';

export default function PeriodToolbar({ data, children }) {
  const [open, setOpen] = useState(false);
  const [dates, setDates] = useState({ from: '', to: '' });
  const [error, setError] = useState('');
  function chooseDates() {
    const bounds = periodBounds(data.range === 'all' ? { ...data, range: 'month' } : data);
    setDates({ from: dateInput(bounds.start), to: dateInput(addDays(bounds.end, -1)) });
    setError(''); setOpen(true);
  }
  function apply(event) {
    event.preventDefault();
    try {
      periodBounds({ range: 'custom', ...dates });
      if (data.setPeriod({ range: 'custom', ...dates })) setOpen(false);
    } catch (e) { setError(e.message); }
  }
  const move = n => data.setPeriod(data.range === 'week' ? { anchor: addDays(data.anchor, 7 * n) } : { month: new Date(data.month.getFullYear(), data.month.getMonth() + n, 1) });
  return <>
    <div className="journal-toolbar">
      <div className="flex min-w-0 flex-wrap items-center gap-2"><span className="text-sm font-medium">{data.accountName}</span><span className="text-xs text-muted-foreground">EUR</span>{data.demo && <span className="demo-label">Beispieldaten</span>}</div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {children}
        <div className="period-switch" role="group" aria-label="Zeitraum">
          {[['week', 'Woche'], ['month', 'Monat'], ['all', 'Gesamt']].map(([key, label]) => <button type="button" key={key} onClick={() => data.setRange(key)} aria-pressed={data.range === key}>{label}</button>)}
          <button type="button" onClick={chooseDates} aria-pressed={data.range === 'custom'} aria-label="Eigenen Zeitraum wählen" title="Eigenen Zeitraum wählen"><CalendarRange size={16} /></button>
        </div>
        {['month', 'week'].includes(data.range) && <div className="month-control" data-range={data.range}>
          <Button variant="ghost" size="icon" aria-label={data.range === 'week' ? 'Vorherige Woche' : 'Vorheriger Monat'} onClick={() => move(-1)}><ChevronLeft /></Button>
          <span className="text-xs">{periodLabel(data)}</span>
          <Button variant="ghost" size="icon" aria-label={data.range === 'week' ? 'Nächste Woche' : 'Nächster Monat'} onClick={() => move(1)}><ChevronRight /></Button>
        </div>}
        {data.range === 'custom' && <Button variant="ghost" size="sm" onClick={chooseDates}>{periodLabel(data)}</Button>}
        {!data.demo && <Button variant="ghost" size="icon" aria-label="Daten aktualisieren" onClick={data.refresh} disabled={data.loading}><RefreshCw className={data.loading ? 'animate-spin' : ''} /></Button>}
      </div>
    </div>
    <p className="-mt-3 mb-6 text-xs text-muted-foreground">Zeitraum und Reihenfolge nach Einstiegsdatum. Ein separates Abschlussdatum wird noch nicht erfasst.</p>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-sm"><DialogTitle>Zeitraum wählen</DialogTitle><DialogDescription>Start und Ende zählen mit. Die Zuordnung erfolgt nach Einstiegsdatum.</DialogDescription>
      <form onSubmit={apply} className="space-y-4">
        <label className="form-field">Von<Input type="date" required value={dates.from} onChange={e => setDates({ ...dates, from: e.target.value })} /></label>
        <label className="form-field">Bis<Input type="date" required min={dates.from} value={dates.to} onChange={e => setDates({ ...dates, to: e.target.value })} /></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button><Button type="submit">Anwenden</Button></div>
      </form>
    </DialogContent></Dialog>
  </>;
}
