"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search, Wrench, LayoutGrid, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { RatingStars } from "@/components/ui/rating-stars";
import { formatINR } from "@/lib/format";
import { globalSearch, type GlobalSearchResults } from "@/services/search";
import { cn } from "@/lib/utils";

export function GlobalSearch({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [term, setTerm] = React.useState("");
  const [state, setState] = React.useState<{ term: string; results: GlobalSearchResults } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const latestTerm = React.useRef("");

  const query = term.trim();
  // Results belong to the exact term that produced them, so typing never shows
  // stale matches and "loading" needs no state of its own.
  const results = state !== null && state.term === query && query.length >= 2 ? state.results : null;
  const loading = query.length >= 2 && results === null;

  React.useEffect(() => {
    if (query.length < 2) return;
    latestTerm.current = query;
    const timer = setTimeout(() => {
      globalSearch(query).then((r) => {
        if (latestTerm.current !== query) return;
        setState({ term: query, results: r });
        setHighlight(0);
      });
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const total = (results?.services.length ?? 0) + (results?.workers.length ?? 0) + (results?.categories.length ?? 0);

  const go = (href: string) => {
    setOpen(false);
    setTerm("");
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      if (open && highlight >= 0 && results) {
        const flat = flatten(results);
        if (flat[highlight]) {
          e.preventDefault();
          go(flat[highlight].href);
        }
        return;
      }
      if (term.trim()) {
        e.preventDefault();
        go(`/search?q=${encodeURIComponent(term.trim())}`);
      }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (total ? (h + 1) % total : 0));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (total ? (h - 1 + total) % total : 0));
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
      <Input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="global-search-listbox"
        aria-autocomplete="list"
        aria-label="Search services, workers and bookings"
        placeholder="Search services, workers…"
        className="pl-9 [&::-webkit-search-cancel-button]:hidden"
        value={term}
        autoFocus={autoFocus}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {loading && (
        <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
      )}

      {open && term.trim().length >= 2 && (
        <div
          id="global-search-listbox"
          role="listbox"
          className="bg-popover absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-border p-1.5 shadow-pop"
        >
          {total === 0 && !loading && (
            <div className="px-3 py-6 text-center">
              <p className="text-sm font-medium">No results for “{term}”</p>
              <p className="text-muted-foreground mt-1 text-[13px]">Try a different keyword or browse all services.</p>
              <Link
                href="/services"
                onClick={() => {
                  setOpen(false);
                  setTerm("");
                }}
                className="text-primary mt-3 inline-flex items-center gap-1 text-[13px] font-medium hover:underline"
              >
                Browse all services <ArrowRight className="size-3.5" />
              </Link>
            </div>
          )}

          {results && results.categories.length > 0 && (
            <Group title="Categories" icon={<LayoutGrid className="size-3.5" />}>
              {results.categories.map((c, i) => (
                <ResultRow
                  key={c.id}
                  index={indexOf(results, "categories", i)}
                  highlight={highlight}
                  onSelect={() => go(`/services?category=${c.id}`)}
                  onHover={setHighlight}
                  icon={<DynamicIcon name={c.icon} className="size-4" />}
                  title={c.name}
                  subtitle={c.description}
                />
              ))}
            </Group>
          )}

          {results && results.services.length > 0 && (
            <Group title="Services" icon={<Sparkles className="size-3.5" />}>
              {results.services.map((s, i) => (
                <ResultRow
                  key={s.id}
                  index={indexOf(results, "services", i)}
                  highlight={highlight}
                  onSelect={() => go(`/services/${s.slug}`)}
                  onHover={setHighlight}
                  icon={<DynamicIcon name={s.icon} className="size-4" />}
                  title={s.name}
                  subtitle={`${formatINR(s.startingPrice)} starting · ${s.workerCount} workers`}
                />
              ))}
            </Group>
          )}

          {results && results.workers.length > 0 && (
            <Group title="Workers" icon={<Wrench className="size-3.5" />}>
              {results.workers.map((w, i) => (
                <ResultRow
                  key={w.id}
                  index={indexOf(results, "workers", i)}
                  highlight={highlight}
                  onSelect={() => go(`/workers/${w.id}`)}
                  onHover={setHighlight}
                  avatar={<AvatarCircle name={w.name} size="sm" />}
                  title={w.name}
                  subtitle={`${w.city} · ${w.experienceYears} yrs exp`}
                  trailing={<RatingStars value={w.rating} showValue size="xs" />}
                />
              ))}
            </Group>
          )}

          {total > 0 && (
            <button
              type="button"
              onClick={() => go(`/search?q=${encodeURIComponent(term.trim())}`)}
              className="text-primary hover:bg-accent mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition"
            >
              See all results for “{term}” <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type GroupKey = "categories" | "services" | "workers";

function indexOf(results: GlobalSearchResults, key: GroupKey, i: number) {
  if (key === "categories") return i;
  if (key === "services") return results.categories.length + i;
  return results.categories.length + results.services.length + i;
}

function flatten(results: GlobalSearchResults) {
  return [
    ...results.categories.map((c) => ({ href: `/services?category=${c.id}` })),
    ...results.services.map((s) => ({ href: `/services/${s.slug}` })),
    ...results.workers.map((w) => ({ href: `/workers/${w.id}` })),
  ];
}

function Group({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="text-muted-foreground flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function ResultRow({
  index,
  highlight,
  onSelect,
  onHover,
  icon,
  avatar,
  title,
  subtitle,
  trailing,
}: {
  index: number;
  highlight: number;
  onSelect: () => void;
  onHover: (i: number) => void;
  icon?: React.ReactNode;
  avatar?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={highlight === index}
      onMouseEnter={() => onHover(index)}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
        highlight === index ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
      )}
    >
      {avatar ?? (
        <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{title}</span>
        {subtitle && <span className="text-muted-foreground block truncate text-xs">{subtitle}</span>}
      </span>
      {trailing}
    </button>
  );
}
