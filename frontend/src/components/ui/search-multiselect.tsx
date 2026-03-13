'use client';

import * as React from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface SearchMultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  creatable?: boolean;
  className?: string;
}

export function SearchMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  emptyMessage = 'No options',
  creatable = false,
  className,
}: SearchMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const allOptions = React.useMemo(() => {
    const fromOpts = options.filter(Boolean);
    const fromValue = value.filter((v) => v && !fromOpts.includes(v));
    return [...new Set([...fromOpts, ...fromValue])];
  }, [options, value]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((o) => o.toLowerCase().includes(q));
  }, [allOptions, search]);

  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  const addCustom = () => {
    const trimmed = search.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setSearch('');
    inputRef.current?.focus();
  };

  const remove = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== item));
  };

  const showAddOption = creatable && search.trim() && !allOptions.includes(search.trim());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-auto min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring',
            'data-[placeholder]:text-muted-foreground',
            className
          )}
        >
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.map((v) => (
                <Badge
                  key={v}
                  variant="secondary"
                  className="h-5 gap-0.5 pr-1 text-xs font-normal"
                >
                  {v}
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => remove(v, e)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted cursor-pointer inline-flex"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            ref={inputRef}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (showAddOption) addCustom();
                else if (filtered[0]) toggle(filtered[0]);
              }
              if (e.key === 'Escape') setOpen(false);
            }}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-1">
            {filtered.length === 0 && !showAddOption ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              <>
                {showAddOption && (
                  <button
                    type="button"
                    onClick={addCustom}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <span className="text-muted-foreground">Add</span>
                    <span className="font-medium">&quot;{search.trim()}&quot;</span>
                  </button>
                )}
                {filtered.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(opt)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent',
                      value.includes(opt) && 'bg-accent/50'
                    )}
                  >
                    {value.includes(opt) ? (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    {opt}
                  </button>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
