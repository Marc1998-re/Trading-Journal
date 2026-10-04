import React, { useRef, useState } from 'react';
import { Info, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { metricHelp } from '@/lib/metricHelp';

function HelpText({ help, pinned = false }) {
  return <div className="space-y-3 text-left text-sm font-normal leading-5">
    <div><strong className={`block font-semibold mb-1 ${pinned ? 'pr-8' : ''}`}>{help.title}</strong><p>{help.meaning}</p></div>
    <div><strong className="block text-xs font-semibold mb-1">Berechnung</strong><p>{help.calculation}</p></div>
    <div><strong className="block text-xs font-semibold mb-1">So liest du den Wert</strong><p>{help.reading}</p></div>
  </div>;
}

export default function MetricHelp({ helpKey, label, triggerText }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const restoringFocus = useRef(false);
  const help = metricHelp[helpKey];
  if (!help) return null;
  const name = label || help.title;
  const contentClass = 'relative z-50 w-80 max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-md border bg-popover p-4 text-popover-foreground shadow-md';
  return <TooltipProvider delayDuration={250}><Popover open={pinned} onOpenChange={open => { setHovered(false); setPinned(open); }}>
    <Tooltip open={hovered && !pinned} onOpenChange={setHovered} disableHoverableContent={false}>
      <PopoverTrigger asChild><TooltipTrigger asChild><button type="button" aria-label={`${name} erklärt`} onFocus={event => { if (restoringFocus.current) event.preventDefault(); }}
        className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${triggerText ? 'min-h-8 text-xs' : 'h-8 w-8'}`}>
        <Info size={triggerText ? 13 : 16} aria-hidden="true" />{triggerText}
      </button></TooltipTrigger></PopoverTrigger>
      <TooltipContent side="bottom" collisionPadding={12} className={contentClass} style={{ maxHeight: 'min(30rem, var(--radix-tooltip-content-available-height))' }}><HelpText help={help}/></TooltipContent>
    </Tooltip>
    <PopoverContent side="bottom" collisionPadding={12} aria-label={`${name} erklärt`} className={contentClass} style={{ maxHeight: 'min(30rem, var(--radix-popover-content-available-height))' }}
      onCloseAutoFocus={() => { restoringFocus.current = true; queueMicrotask(() => { restoringFocus.current = false; }); }}>
      <button type="button" aria-label="Erklärung schließen" onClick={() => setPinned(false)} className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><X size={16} aria-hidden="true"/></button>
      <HelpText help={help} pinned/>
    </PopoverContent>
  </Popover></TooltipProvider>;
}
