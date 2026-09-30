"use client";

import * as React from "react";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className,
  onClear,
  autoFocus,
  size = "default",
  loading,
  ariaLabel = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  size?: "sm" | "default" | "lg";
  loading?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        type="search"
        role="searchbox"
        aria-label={ariaLabel}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden",
          size === "sm" && "h-9",
          size === "lg" && "h-12 text-base",
        )}
      />
      {loading ? (
        <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
      ) : value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 transition focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-3.5" />
          <span className="sr-only">Clear search</span>
        </button>
      ) : null}
    </div>
  );
}

export function DebouncedSearchBar({
  value,
  onChange,
  debounceMs = 300,
  ...props
}: React.ComponentProps<typeof SearchBar> & { debounceMs?: number }) {
  const [local, setLocal] = React.useState(value);
  const [debounced, setDebounced] = React.useState(value);
  const [lastValue, setLastValue] = React.useState(value);

  // Adjust state during render when the parent pushes a new value down, which is
  // the documented alternative to a syncing effect.
  if (value !== lastValue) {
    setLastValue(value);
    setLocal(value);
    setDebounced(value);
  }

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(local), debounceMs);
    return () => clearTimeout(t);
  }, [local, debounceMs]);
  React.useEffect(() => {
    if (debounced !== value) onChange(debounced);
  }, [debounced, onChange, value]);

  return <SearchBar {...props} value={local} onChange={setLocal} />;
}

export function FilterChips({
  items,
  active,
  onChange,
  className,
}: {
  items: { value: string; label: string; count?: number }[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          aria-pressed={active === item.value}
          className={cn(
            "focus-visible:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition focus-visible:ring-2 focus-visible:outline-none",
            active === item.value
              ? "border-primary bg-primary text-primary-foreground shadow-soft"
              : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px]",
                active === item.value ? "bg-white/20" : "bg-muted text-muted-foreground",
              )}
            >
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function ActiveFilterBar({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: { key: string; label: string }[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}) {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs font-semibold uppercase">Active:</span>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onRemove(f.key)}
          className="bg-brand-soft text-brand-soft-foreground hover:opacity-80 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium transition"
        >
          {f.label}
          <X className="size-3" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      {filters.length > 1 && (
        <Button variant="ghost" size="xs" onClick={onClearAll}>
          Clear all
        </Button>
      )}
    </div>
  );
}
