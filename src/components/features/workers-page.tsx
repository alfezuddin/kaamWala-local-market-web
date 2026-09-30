"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { SearchBar, ActiveFilterBar, FilterChips } from "@/components/ui/search-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WorkerCard } from "@/components/ui/worker-card";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { useApiQuery } from "@/hooks/use-api";
import { getCategories, getSubcategories } from "@/services/catalog";
import { getWorkers, type WorkerFilters } from "@/services/workers";
import { AREAS, CITIES, SORT_OPTIONS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { useToast } from "@/components/ui/toaster";

export function WorkersPage() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const [search, setSearch] = React.useState(params.get("q") ?? "");
  const [categoryId, setCategoryId] = React.useState(params.get("category") ?? "all");
  const [subcategoryId, setSubcategoryId] = React.useState(params.get("subcategory") ?? "all");
  const [city, setCity] = React.useState(params.get("city") ?? "Indore");
  const [area, setArea] = React.useState("all");
  const [minRating, setMinRating] = React.useState(0);
  const [maxDistance, setMaxDistance] = React.useState(0);
  const [availableOnly, setAvailableOnly] = React.useState(false);
  const [sort, setSort] = React.useState("recommended");
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const categoriesQuery = useApiQuery(["workers", "categories"], () => getCategories(), { staleTime: 5 * 60_000 });
  const subQuery = useApiQuery(
    ["workers", "subcategories", categoryId],
    () => (categoryId === "all" ? Promise.resolve([]) : getSubcategories(categoryId)),
    { enabled: categoryId !== "all" },
  );

  const filters: WorkerFilters = React.useMemo(
    () => ({
      search: search || undefined,
      categoryId: categoryId === "all" ? undefined : categoryId,
      subcategoryId: subcategoryId === "all" ? undefined : subcategoryId,
      city,
      area: area === "all" ? undefined : area,
      minRating: minRating || undefined,
      maxDistance: maxDistance || undefined,
      availableOnly: availableOnly || undefined,
      sort: sort as WorkerFilters["sort"],
    }),
    [search, categoryId, subcategoryId, city, area, minRating, maxDistance, availableOnly, sort],
  );

  const workersQuery = useApiQuery(["workers", "list", filters], () => getWorkers(filters));

  React.useEffect(() => {
    const q = new URLSearchParams();
    if (search) q.set("q", search);
    if (categoryId !== "all") q.set("category", categoryId);
    if (subcategoryId !== "all") q.set("subcategory", subcategoryId);
    if (city !== "Indore") q.set("city", city);
    router.replace(`/workers?${q.toString()}`, { scroll: false });
  }, [search, categoryId, subcategoryId, city, router]);

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Location unavailable", "Your browser does not support location access.");
      return;
    }
    let geoToastId = "";
    try {
      geoToastId = toast.info("Finding your location…");
    } catch {
      geoToastId = "";
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        if (geoToastId) toast.dismiss(geoToastId);
        toast.success("Location detected", "Showing workers near Vijay Nagar, Indore.");
        setArea("Vijay Nagar");
      },
      () => {
        if (geoToastId) toast.dismiss(geoToastId);
        toast.error("Could not access location", "Please enable location permission and try again.");
      },
      { timeout: 8000 },
    );
  };

  const activeFilters = [
    ...(search ? [{ key: "search", label: `“${search}”` }] : []),
    ...(categoryId !== "all"
      ? [{ key: "category", label: categoriesQuery.data?.find((c) => c.id === categoryId)?.name ?? "Category" }]
      : []),
    ...(subcategoryId !== "all" ? [{ key: "subcategory", label: "Subcategory" }] : []),
    ...(area !== "all" ? [{ key: "area", label: area }] : []),
    ...(minRating ? [{ key: "rating", label: `${minRating}★ & above` }] : []),
    ...(maxDistance ? [{ key: "distance", label: `Within ${maxDistance} km` }] : []),
    ...(availableOnly ? [{ key: "available", label: "Available now" }] : []),
  ];

  const removeFilter = (key: string) => {
    if (key === "search") setSearch("");
    if (key === "category") {
      setCategoryId("all");
      setSubcategoryId("all");
    }
    if (key === "subcategory") setSubcategoryId("all");
    if (key === "area") setArea("all");
    if (key === "rating") setMinRating(0);
    if (key === "distance") setMaxDistance(0);
    if (key === "available") setAvailableOnly(false);
  };

  const clearAll = () => {
    setSearch("");
    setCategoryId("all");
    setSubcategoryId("all");
    setArea("all");
    setMinRating(0);
    setMaxDistance(0);
    setAvailableOnly(false);
  };

  const workers = workersQuery.data ?? [];

  const filterPanel = (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-[13px] font-semibold">Work category</h3>
        <div className="space-y-1">
          <Option
            label="All categories"
            active={categoryId === "all"}
            onClick={() => {
              setCategoryId("all");
              setSubcategoryId("all");
            }}
          />
          {(categoriesQuery.data ?? []).map((c) => (
            <Option
              key={c.id}
              label={c.name}
              icon={c.icon}
              active={categoryId === c.id}
              onClick={() => {
                setCategoryId(c.id);
                setSubcategoryId("all");
              }}
            />
          ))}
        </div>
      </div>

      {categoryId !== "all" && (
        <div>
          <h3 className="mb-2 text-[13px] font-semibold">Subcategory</h3>
          <div className="space-y-1">
            <Option label="All" active={subcategoryId === "all"} onClick={() => setSubcategoryId("all")} />
            {(subQuery.data ?? []).map((s) => (
              <Option key={s.id} label={s.name} active={subcategoryId === s.id} onClick={() => setSubcategoryId(s.id)} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-[13px] font-semibold">City</h3>
        <Select value={city} onValueChange={(v) => {
          setCity(v);
          setArea("all");
        }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="mb-2 text-[13px] font-semibold">Area</h3>
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All areas</SelectItem>
            {(AREAS[city] ?? []).map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="mb-2 text-[13px] font-semibold">Minimum rating</h3>
        <div className="space-y-1">
          {[4.5, 4, 3.5].map((r) => (
            <Option
              key={r}
              label={`${r}★ & above`}
              active={minRating === r}
              onClick={() => setMinRating(minRating === r ? 0 : r)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-[13px] font-semibold">Distance</h3>
        <div className="space-y-1">
          {[3, 5, 10].map((d) => (
            <Option
              key={d}
              label={`Within ${d} km`}
              active={maxDistance === d}
              onClick={() => setMaxDistance(maxDistance === d ? 0 : d)}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <Label htmlFor="available-only" className="text-[13px]">
          Available now
        </Label>
        <Switch id="available-only" checked={availableOnly} onCheckedChange={setAvailableOnly} />
      </div>

      <Button variant="outline" size="sm" className="w-full" icon={<Navigation />} onClick={useMyLocation}>
        Use my current location
      </Button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Find a Worker</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {formatNumber(workers.length)} verified {workers.length === 1 ? "professional" : "professionals"} near you, sorted
          by rating, price and distance.
        </p>
      </header>

      <div className="mb-5">
        <FilterChips
          items={[
            { value: "all", label: "All categories" },
            ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
          ]}
          active={categoryId}
          onChange={(v) => {
            setCategoryId(v);
            setSubcategoryId("all");
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <Card className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto scrollbar-thin">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Filters</h2>
                {activeFilters.length > 0 && (
                  <Button variant="ghost" size="xs" onClick={clearAll}>
                    Clear
                  </Button>
                )}
              </div>
              {filterPanel}
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name or skill…"
              className="sm:max-w-xs"
            />
            <div className="flex items-center gap-2 sm:ml-auto">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden" icon={<SlidersHorizontal />}>
                    Filters
                    {activeFilters.length > 0 && (
                      <Badge variant="brand" size="sm">
                        {activeFilters.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto scrollbar-thin">
                  <SheetHeader>
                    <SheetTitle className="flex items-center justify-between">
                      Filters
                      {activeFilters.length > 0 && (
                        <Button variant="ghost" size="xs" onClick={clearAll}>
                          Clear all
                        </Button>
                      )}
                    </SheetTitle>
                  </SheetHeader>
                  {filterPanel}
                  <div className="sticky bottom-0 border-t border-border bg-card p-4">
                    <Button className="w-full" onClick={() => setSheetOpen(false)}>
                      Show {workers.length} worker{workers.length === 1 ? "" : "s"}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFilters.length > 0 && <ActiveFilterBar filters={activeFilters} onRemove={removeFilter} onClearAll={clearAll} />}

          {workersQuery.isError ? (
            <ErrorState onRetry={() => workersQuery.refetch()} />
          ) : workers.length === 0 && !workersQuery.isLoading ? (
            <EmptyState
              icon="search"
              title="No workers found"
              description="Try widening your area, lowering the rating filter, or choosing another category."
              actionLabel="Clear all filters"
              onAction={clearAll}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {workersQuery.isLoading
                ? Array.from({ length: 6 }).map((_, i) => <WorkerSkeleton key={i} />)
                : workers.map(({ worker, distance }) => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      categoryName={categoriesQuery.data?.find((c) => c.id === worker.categoryId)?.name}
                      distance={distance}
                      onRequest={() => router.push(`/customer/book/new?worker=${worker.id}`)}
                    />
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkerSkeleton() {
  return (
    <div className="bg-card space-y-4 rounded-xl border border-border p-5">
      <div className="flex gap-3.5">
        <div className="animate-shimmer size-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="animate-shimmer h-4 w-2/3 rounded-md" />
          <div className="animate-shimmer h-3 w-1/2 rounded-md" />
        </div>
      </div>
      <div className="animate-shimmer h-3 w-full rounded-md" />
      <div className="animate-shimmer h-3 w-4/5 rounded-md" />
      <div className="flex gap-2 pt-2">
        <div className="animate-shimmer h-8 flex-1 rounded-lg" />
        <div className="animate-shimmer h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

function Option({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
        active ? "bg-brand-soft text-brand-soft-foreground font-medium" : "hover:bg-accent"
      }`}
    >
      {icon ? <DynamicIcon name={icon} className="size-4 shrink-0" /> : null}
      <span className="truncate">{label}</span>
    </button>
  );
}
