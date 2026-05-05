import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function SymbolCombobox({ value, onChange, symbols = [] }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Sync internal input value when popover opens
  useEffect(() => {
    if (open) {
      setInputValue(value || '');
    }
  }, [open, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background font-normal",
            !value && "text-muted-foreground"
          )}
        >
          {value || "Select or type symbol..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type new..."
            value={inputValue}
            onValueChange={(val) => {
              setInputValue(val);
              onChange(val.toUpperCase()); // Update parent immediately as user types
            }}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue ? `Will use "${inputValue.toUpperCase()}"` : "No symbols found."}
            </CommandEmpty>
            <CommandGroup>
              {symbols.map((symbol) => (
                <CommandItem
                  key={symbol}
                  value={symbol}
                  onSelect={() => {
                    onChange(symbol);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.toUpperCase() === symbol.toUpperCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {symbol}
                </CommandItem>
              ))}
              {inputValue && !symbols.some(s => s.toUpperCase() === inputValue.toUpperCase()) && (
                <CommandItem
                  value={inputValue}
                  onSelect={() => {
                    onChange(inputValue.toUpperCase());
                    setOpen(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Create "{inputValue.toUpperCase()}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}