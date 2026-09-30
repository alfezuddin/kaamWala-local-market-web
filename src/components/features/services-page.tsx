"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { SearchBar, ActiveFilterBar, FilterChips } from "@/components/ui/search-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RatingStars } from "@/components/ui/rating-stars";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useApiQuery } from "@/hooks/use-api";
import { getCategories, getServices, getSubcategories, type ServiceFilters } from "@/services/catalog";
import { SORT_OPTIONS, CITIES } from "@/lib/constants";
import { ServiceCard } from "@/components/ui/service-card";

const PRICE_BANDS = [
  { value: "0-500", label: "Under ₹500", min: 0, max: 500 },
  { value: "500-1000", label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { value: "1000-2500", label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { value: "2500-", label: "Above ₹2,500", min: 2500, max: 100000 },
];

const RATINGS = [
  { value: 4.5, label: "4.5 & above" },
  { value: 4, label: "4.0 & above" },
  { value: 3.5, label: "3.5 & above" },
];

export function ServicesPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = React.useState(params.get("q") ?? "");
  const [categoryId, setCategoryId] = React.useState(params.get("category") ?? "all");
  const [subcategoryId, setSubcategoryId] = React.useState(params.get("subcategory") ?? "all");
  const [city, setCity] = React.useState(params.get("city") ?? "Indore");
  const [priceBand, setPriceBand] = React.useState("all");
  const [minRating, setMinRating] = React.useState(0);
  const [sort, setSort] = React.useState<string>("recommended");
  const [filterSheetOpen, setFilterSheetOpen] = React.useState(false);

  const categoriesQuery = useApiQuery(["services", "categories"], () => getCategories(), { staleTime: 5 * 60_000 });
  const subQuery = useApiQuery(
    ["services", "subcategories", categoryId],
    () => (categoryId === "all" ? Promise.resolve([]) : getSubcategories(categoryId)),
    { enabled: categoryId !== "all" },
  );

  const band = PRICE_BANDS.find((b) => b.value === priceBand);

  const filters: ServiceFilters = React.useMemo(
    () => ({
      search: search || undefined,
      categoryId: categoryId === "all" ? undefined : categoryId,
      subcategoryId: subcategoryId === "all" ? undefined : subcategoryId,
      minPrice: band?.min,
      maxPrice: band?.max,
      minRating: minRating || undefined,
      sort: sort as ServiceFilters["sort"],
    }),
    [search, categoryId, subcategoryId, band, minRating, sort],
  );

  const servicesQuery = useApiQuery(["services", "list", filters], () => getServices(filters));

  // Reflect the primary filters in the URL so results are shareable.
  React.useEffect(() => {
    const q = new URLSearchParams();
    if (search) q.set("q", search);
    if (categoryId !== "all") q.set("category", categoryId);
    if (subcategoryId !== "all") q.set("subcategory", subcategoryId);
    if (city !== "Indore") q.set("city", city);
    router.replace(`/services?${q.toString()}`, { scroll: false });
  }, [search, categoryId, subcategoryId, city, router]);

  const activeFilters = [
    ...(search ? [{ key: "search", label: `“${search}”` }] : []),
    ...(categoryId !== "all"
      ? [{ key: "category", label: categoriesQuery.data?.find((c) => c.id === categoryId)?.name ?? "Category" }]
      : []),
    ...(subcategoryId !== "all" ? [{ key: "subcategory", label: "Subcategory" }] : []),
    ...(priceBand !== "all" ? [{ key: "price", label: band?.label ?? "Price" }] : []),
    ...(minRating ? [{ key: "rating", label: `${minRating}★ & above` }] : []),
  ];

  const removeFilter = (key: string) => {
    if (key === "search") setSearch("");
    if (key === "category") {
      setCategoryId("all");
      setSubcategoryId("all");
    }
    if (key === "subcategory") setSubcategoryId("all");
    if (key === "price") setPriceBand("all");
    if (key === "rating") setMinRating(0);
  };

  const clearAll = () => {
    setSearch("");
    setCategoryId("all");
    setSubcategoryId("all");
    setPriceBand("all");
    setMinRating(0);
  };

  const services = servicesQuery.data ?? [];
  const activeCategory = categoriesQuery.data?.find((c) => c.id === categoryId);

  const filterPanel = (
    <div className="space-y-6">
      <FilterSection title="Category">
        <div className="space-y-1">
          <CategoryOption
            label="All categories"
            active={categoryId === "all"}
            onClick={() => {
              setCategoryId("all");
              setSubcategoryId("all");
            }}
          />
          {(categoriesQuery.data ?? []).map((category) => (
            <CategoryOption
              key={category.id}
              label={category.name}
              icon={category.icon}
              active={categoryId === category.id}
              onClick={() => {
                setCategoryId(category.id);
                setSubcategoryId("all");
              }}
            />
          ))}
        </div>
      </FilterSection>

      {categoryId !== "all" && (
        <FilterSection title="Subcategory">
          <div className="space-y-1">
            <CategoryOption
              label="All subcategories"
              active={subcategoryId === "all"}
              onClick={() => setSubcategoryId("all")}
            />
            {(subQuery.data ?? []).map((sub) => (
              <CategoryOption
                key={sub.id}
                label={sub.name}
                active={subcategoryId === sub.id}
                onClick={() => setSubcategoryId(sub.id)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Price range">
        <div className="space-y-1">
          <CategoryOption label="Any price" active={priceBand === "all"} onClick={() => setPriceBand("all")} />
          {PRICE_BANDS.map((b) => (
            <CategoryOption
              key={b.value}
              label={b.label}
              active={priceBand === b.value}
              onClick={() => setPriceBand(b.value)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Minimum rating">
        <div className="space-y-1.5">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setMinRating(minRating === r.value ? 0 : r.value)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-accent"
            >
              <span
                className={`size-3.5 rounded-full border-2 ${minRating === r.value ? "border-primary bg-primary" : "border-border"}`}
              />
              <RatingStars value={r.value} showValue={false} size="xs" />
              <span className="text-muted-foreground text-[13px]">& above</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="City">
        <Select value={city} onValueChange={setCity}>
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
      </FilterSection>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="text-muted-foreground flex items-center gap-1 text-[13px]">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <ChevronRight className="size-3.5" />
          <li className="text-foreground font-medium">Services</li>
          {activeCategory && (
            <>
              <ChevronRight className="size-3.5" />
              <li className="text-foreground font-medium">{activeCategory.name}</li>
            </>
          )}
        </ol>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {activeCategory ? activeCategory.name : "All services"}
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {activeCategory
            ? activeCategory.description
            : "Browse every service KaamWala offers, with fixed visit charges and verified professionals."}
        </p>
      </header>

      {activeCategory && activeCategory.subcategories.length > 0 && (
        <div className="mb-6">
          <FilterChips
            items={[
              { value: "all", label: "All" },
              ...activeCategory.subcategories.map((s) => ({ value: s.id, label: s.name })),
            ]}
            active={subcategoryId}
            onChange={setSubcategoryId}
          />
        </div>
      )}

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
            <SearchBar value={search} onChange={setSearch} placeholder="Search services…" className="sm:max-w-xs" />
            <div className="flex items-center gap-2 sm:ml-auto">
              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
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
                    <Button className="w-full" onClick={() => setFilterSheetOpen(false)}>
                      Show {services.length} result{services.length === 1 ? "" : "s"}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <ActiveFilterBar filters={activeFilters} onRemove={removeFilter} onClearAll={clearAll} />
          )}

          <p className="text-muted-foreground text-[13px]">
            {servicesQuery.isLoading
              ? "Finding services…"
              : `Showing ${services.length} service${services.length === 1 ? "" : "s"} in ${city}`}
          </p>

          {servicesQuery.isError ? (
            <ErrorState onRetry={() => servicesQuery.refetch()} />
          ) : services.length === 0 && !servicesQuery.isLoading ? (
            <EmptyState
              icon="search"
              title="No services found"
              description="Try removing a filter or searching for a different service."
              actionLabel="Clear all filters"
              onAction={clearAll}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {servicesQuery.isLoading
                ? Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)
                : services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      categoryName={categoriesQuery.data?.find((c) => c.id === service.categoryId)?.name}
                      onBook={() => router.push(`/customer/book/new?service=${service.id}`)}
                    />
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="bg-card space-y-3 overflow-hidden rounded-xl border border-border">
      <div className="animate-shimmer h-36 w-full" />
      <div className="space-y-2 p-4">
        <div className="animate-shimmer h-4 w-2/3 rounded-md" />
        <div className="animate-shimmer h-3 w-full rounded-md" />
        <div className="animate-shimmer h-3 w-4/5 rounded-md" />
        <div className="flex items-center justify-between pt-3">
          <div className="animate-shimmer h-6 w-20 rounded-md" />
          <div className="animate-shimmer h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[13px] font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function CategoryOption({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: string;
}) {
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
