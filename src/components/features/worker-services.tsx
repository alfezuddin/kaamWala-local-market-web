"use client";

import * as React from "react";
import { Check, IndianRupee, Save, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader, SectionCard } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { getCategories, getServices } from "@/services/catalog";
import { getWorkerDashboard, updateWorkerPricing, updateWorkerServices } from "@/services/workers";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Pricing, Service, ServiceCategory, Subcategory } from "@/types";

export function WorkerServicesPage() {
  const toast = useToast();
  const { session } = useAuth();
  const userId = session?.userId;
  const dbVersion = useDbVersion();

  const [categoryId, setCategoryId] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<string[] | null>(null);
  const [subSelected, setSubSelected] = React.useState<string[] | null>(null);
  const [pricing, setPricing] = React.useState<Pricing | null>(null);

  const dashboardQuery = useApiQuery(
    ["worker", "dashboard", userId, dbVersion],
    () => (userId ? getWorkerDashboard(userId) : Promise.resolve(null)),
    { enabled: Boolean(userId) },
  );

  const categoriesQuery = useApiQuery(["catalog", "categories"], () => getCategories());

  const servicesQuery = useApiQuery(
    ["catalog", "services", categoryId, search],
    () => getServices({ categoryId: categoryId === "ALL" ? undefined : categoryId, search: search.trim() || undefined }),
  );

  // Seed the selection from the worker's saved service list, then let the
  // worker edit freely without overwriting unsaved choices.
  const worker = dashboardQuery.data?.worker ?? null;
  const [lastWorker, setLastWorker] = React.useState<typeof worker>(null);
  if (worker && worker !== lastWorker) {
    setLastWorker(worker);
    setSelected(worker.serviceIds);
    setSubSelected(worker.subcategoryIds);
    setPricing(worker.pricing);
  }

  const saveServices = useApiMutation(
    (vars: { serviceIds: string[]; subcategoryIds: string[] }) =>
      updateWorkerServices(userId ?? "", vars.serviceIds, vars.subcategoryIds),
    {
      onSuccess: () => {
        toast.success("Services updated", "Customers can now find you for these services.");
        dashboardQuery.refetch();
      },
      onError: (error) => toast.error("Could not save services", error.message),
    },
  );

  const savePricing = useApiMutation((vars: Pricing) => updateWorkerPricing(userId ?? "", vars), {
    onSuccess: () => {
      toast.success("Pricing updated", "New rates apply to future bookings.");
      dashboardQuery.refetch();
    },
    onError: (error) => toast.error("Could not save pricing", error.message),
  });

  const active = (categoriesQuery.data ?? []) as ServiceCategory[];

  const services = (servicesQuery.data ?? []) as Service[];
  const filtered = services.filter((s) => {
    if (!search.trim()) return true;
    return s.name.toLowerCase().includes(search.trim().toLowerCase());
  });

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  if (dashboardQuery.isLoading || categoriesQuery.isLoading) {
    return <SectionLoader label="Loading your services…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Services & Pricing"
        description="Choose the services you want to receive requests for, and set your rates."
        breadcrumbs={[{ label: "Professional", href: "/worker/dashboard" }, { label: "My Services" }]}
        actions={
          <Button
            onClick={() => {
              if (!selected) return;
              if (selected.length === 0) {
                toast.warning("Select at least one service", "Customers can only request services you offer.");
                return;
              }
              saveServices.mutate({ serviceIds: selected, subcategoryIds: subSelected ?? [] });
            }}
            loading={saveServices.isPending}
            disabled={!selected}
            icon={<Save />}
          >
            Save services
          </Button>
        }
      />

      <SectionCard
        title="Your rates"
        description="These values shape the price customers see for each service."
        icon={<IndianRupee />}
      >
        {pricing ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-visit">Visit charge</Label>
              <Input
                id="p-visit"
                type="number"
                min={0}
                value={pricing.visitCharge}
                onChange={(e) => setPricing({ ...pricing, visitCharge: Number(e.target.value) || 0 })}
              />
              <p className="text-muted-foreground text-xs">Added to every visit.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-start">Starting price</Label>
              <Input
                id="p-start"
                type="number"
                min={0}
                value={pricing.startingPrice}
                onChange={(e) => setPricing({ ...pricing, startingPrice: Number(e.target.value) || 0 })}
              />
              <p className="text-muted-foreground text-xs">Lowest rate customers see.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-hourly">Hourly rate</Label>
              <Input
                id="p-hourly"
                type="number"
                min={0}
                value={pricing.hourlyPrice}
                onChange={(e) => setPricing({ ...pricing, hourlyPrice: Number(e.target.value) || 0 })}
              />
              <p className="text-muted-foreground text-xs">Used for hourly jobs.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-min">Minimum job amount</Label>
              <Input
                id="p-min"
                type="number"
                min={0}
                value={pricing.minJobAmount}
                onChange={(e) => setPricing({ ...pricing, minJobAmount: Number(e.target.value) || 0 })}
              />
              <p className="text-muted-foreground text-xs">Floor for every booking.</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <div className="bg-muted/60 flex flex-wrap items-center justify-between gap-3 rounded-lg p-3">
                <p className="text-sm">
                  A customer booking today would pay{" "}
                  <span className="font-semibold">
                    {formatINR(
                      Math.max(pricing.startingPrice, pricing.minJobAmount) + pricing.visitCharge,
                    )}
                  </span>{" "}
                  before the platform fee.
                </p>
                <Button
                  size="sm"
                  onClick={() => savePricing.mutate(pricing)}
                  loading={savePricing.isPending}
                >
                  Save pricing
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Loading your current rates…</p>
        )}
      </SectionCard>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-base">Services you offer</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services…"
              icon={<Search />}
              className="sm:w-64"
              aria-label="Search services…"
            />
          </div>
          <Tabs value={categoryId} onValueChange={setCategoryId}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="ALL">All categories</TabsTrigger>
              {active.map((c) => (
                <TabsTrigger key={c.id} value={c.id}>
                  {c.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {categoryId === "ALL" ? (
            <EmptyState
              compact
              icon="inbox"
              title="Pick a category"
              description="Choose a category above to see the services you can offer."
            />
          ) : servicesQuery.isLoading ? (
            <SectionLoader label="Loading services…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              compact
              icon="search"
              title="No services found"
              description="Try a different search term."
            />
          ) : (
            <CategoryBlock
              category={active.find((c) => c.id === categoryId)!}
              services={filtered}
              selected={selected ?? []}
              subSelected={subSelected ?? []}
              onToggleService={(id) => setSelected((prev) => toggle(prev ?? [], id))}
              onToggleSub={(id) => setSubSelected((prev) => toggle(prev ?? [], id))}
            />
          )}

          {selected && (
            <p className="text-muted-foreground mt-4 text-[13px]">
              {selected.length} service{selected.length === 1 ? "" : "s"} selected.{" "}
              {worker ? `${worker.completedJobs} jobs completed so far.` : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryBlock({
  category,
  services,
  selected,
  subSelected,
  onToggleService,
  onToggleSub,
}: {
  category: ServiceCategory;
  services: Service[];
  selected: string[];
  subSelected: string[];
  onToggleService: (id: string) => void;
  onToggleSub: (id: string) => void;
}) {
  const subcategories = category.subcategories as Subcategory[];
  return (
    <div className="space-y-5">
      {subcategories.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">Subcategories</p>
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => {
              const active = subSelected.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onToggleSub(sub.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition",
                    active ? "border-brand bg-brand-soft text-brand-soft-foreground" : "border-border hover:border-brand/40",
                  )}
                >
                  {active && <Check className="size-3.5" />}
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">Services</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {services.map((service) => {
            const active = selected.includes(service.id);
            return (
              <li key={service.id}>
                <button
                  type="button"
                  onClick={() => onToggleService(service.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                    active ? "border-brand bg-brand-soft/50" : "border-border hover:border-brand/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border",
                      active ? "border-brand bg-brand text-white" : "border-border",
                    )}
                  >
                    {active && <Check className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{service.name}</span>
                    <span className="text-muted-foreground block text-[13px]">
                      From {formatINR(service.startingPrice)} · {service.shortDescription}
                    </span>
                  </span>
                  <Badge variant="outline" size="sm">
                    {service.rating.toFixed(1)}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}


