"use client";

import * as React from "react";
import { FolderTree, Plus, Power, Search, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import {
  createCategory,
  createService,
  deleteCategory,
  deleteService,
  getAdminServices,
  getCategories,
  getCategoryStats,
  updateCategory,
  updateService,
  type CategoryInput,
  type ServiceInput,
} from "@/services/catalog";
import { formatINR } from "@/lib/format";

type PendingDelete = { kind: "service" | "category"; id: string; name: string } | null;

export function AdminServicesPage() {
  const toast = useToast();
  const dbVersion = useDbVersion();
  const [tab, setTab] = React.useState("services");
  const [search, setSearch] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("ALL");
  const [includeInactive, setIncludeInactive] = React.useState(false);
  const [serviceFormOpen, setServiceFormOpen] = React.useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<PendingDelete>(null);

  const categoriesQuery = useApiQuery(["catalog", "admin-categories", includeInactive, dbVersion], () =>
    getCategories(includeInactive),
  );
  const servicesQuery = useApiQuery(
    ["catalog", "admin-services", search, categoryId, includeInactive, dbVersion],
    () =>
      getAdminServices({
        search: search.trim() || undefined,
        categoryId: categoryId === "ALL" ? undefined : categoryId,
        includeInactive,
      }),
  );
  const statsQuery = useApiQuery(["catalog", "admin-category-stats", dbVersion], () => getCategoryStats());

  const toggleService = useApiMutation(
    (vars: { id: string; isActive: boolean }) => updateService(vars.id, { isActive: vars.isActive }),
    {
      onSuccess: (_, vars) => {
        toast.success(vars.isActive ? "Service published" : "Service hidden");
        servicesQuery.refetch();
      },
      onError: (error) => toast.error("Could not update service", error.message),
    },
  );

  const toggleCategory = useApiMutation(
    (vars: { id: string; isActive: boolean }) => updateCategory(vars.id, { isActive: vars.isActive }),
    {
      onSuccess: (_, vars) => {
        toast.success(vars.isActive ? "Category published" : "Category hidden");
        categoriesQuery.refetch();
        servicesQuery.refetch();
        statsQuery.refetch();
      },
      onError: (error) => toast.error("Could not update category", error.message),
    },
  );

  const addCategory = useApiMutation((input: CategoryInput) => createCategory(input), {
    onSuccess: () => {
      setCategoryFormOpen(false);
      toast.success("Category created");
      categoriesQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => toast.error("Could not create category", error.message),
  });

  const addService = useApiMutation((input: ServiceInput) => createService(input), {
    onSuccess: () => {
      setServiceFormOpen(false);
      toast.success("Service created", "It is now visible in customer search.");
      servicesQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error) => toast.error("Could not create service", error.message),
  });

  const remove = useApiMutation(
    (vars: { kind: "service" | "category"; id: string }): Promise<unknown> =>
      vars.kind === "service" ? deleteService(vars.id) : deleteCategory(vars.id),
    {
      onSuccess: (_, vars) => {
        setPendingDelete(null);
        toast.success(vars.kind === "service" ? "Service deleted" : "Category deleted");
        servicesQuery.refetch();
        categoriesQuery.refetch();
        statsQuery.refetch();
      },
      onError: (error) => toast.error("Could not delete", error.message),
    },
  );

  const categories = categoriesQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const stats = statsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Manage the categories and services customers can book."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Services" }]}
        actions={
          <>
            <Button variant="outline" onClick={() => setCategoryFormOpen(true)} icon={<FolderTree />}>
              New category
            </Button>
            <Button onClick={() => setServiceFormOpen(true)} icon={<Plus />}>
              New service
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Categories" value={String(stats.length)} />
        <MiniStat
          label="Active categories"
          value={String(stats.filter((s) => s.category.isActive).length)}
        />
        <MiniStat label="Services" value={String(services.length)} />
        <MiniStat
          label="Services offered"
          value={String(stats.reduce((sum, s) => sum + s.services, 0))}
        />
      </div>

      <Card>
        <CardContent className="pt-5">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-4 space-y-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_220px_auto]">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services…"
                  icon={<Search />}
                  aria-label="Search services…"
                />
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  aria-label="Filter by category"
                  className="border-border bg-background h-10 rounded-lg border px-3 text-sm"
                >
                  <option value="ALL">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <label className="text-muted-foreground flex items-center gap-2 text-[13px] whitespace-nowrap">
                  <Switch checked={includeInactive} onCheckedChange={setIncludeInactive} /> Show hidden
                </label>
              </div>

              {servicesQuery.isLoading ? (
                <SectionLoader label="Loading services…" />
              ) : services.length === 0 ? (
                <EmptyState
                  icon="search"
                  title="No services found"
                  description="Create a service or adjust your filters."
                  actionLabel="New service"
                  onAction={() => setServiceFormOpen(true)}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[52rem] text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border text-left text-xs uppercase tracking-wide">
                        <th className="px-3 py-2 font-medium">Service</th>
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 text-right font-medium">Starts at</th>
                        <th className="px-3 py-2 text-right font-medium">Rating</th>
                        <th className="px-3 py-2 text-right font-medium">Bookings</th>
                        <th className="px-3 py-2 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((s) => (
                        <tr key={s.id} className="hover:bg-accent/40 border-b border-border/60 last:border-0">
                          <td className="px-3 py-3">
                            <p className="font-medium">
                              {s.name}{" "}
                              {!s.isActive && (
                                <Badge variant="warning" className="ml-1">
                                  Hidden
                                </Badge>
                              )}
                            </p>
                            <p className="text-muted-foreground max-w-sm truncate text-xs">
                              {s.shortDescription}
                            </p>
                          </td>
                          <td className="text-muted-foreground px-3 py-3 text-[13px]">
                            {s.category?.name ?? "—"}
                            {s.subcategory && (
                              <span className="block text-xs">{s.subcategory.name}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">{formatINR(s.startingPrice)}</td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {s.rating > 0 ? s.rating.toFixed(1) : "—"}
                            <span className="text-muted-foreground block text-xs">
                              {s.reviewCount} reviews
                            </span>
                          </td>
                          <td className="text-muted-foreground px-3 py-3 text-right tabular-nums">
                            {s.bookingCount}
                            <span className="block text-xs">{s.completedCount} done</span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label={s.isActive ? `Hide ${s.name}` : `Publish ${s.name}`}
                                onClick={() => toggleService.mutate({ id: s.id, isActive: !s.isActive })}
                              >
                                <Power className={s.isActive ? "text-success" : "text-muted-foreground"} />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label={`Delete ${s.name}`}
                                onClick={() => setPendingDelete({ kind: "service", id: s.id, name: s.name })}
                              >
                                <Trash2 className="text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories" className="mt-4 space-y-3">
              <label className="text-muted-foreground flex items-center gap-2 text-[13px]">
                <Switch checked={includeInactive} onCheckedChange={setIncludeInactive} /> Show hidden categories
              </label>
              {categoriesQuery.isLoading ? (
                <SectionLoader label="Loading categories…" />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {categories.map((c) => {
                    const row = stats.find((s) => s.category.id === c.id);
                    return (
                      <li key={c.id} className="border-border rounded-xl border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{c.name}</p>
                            <p className="text-muted-foreground line-clamp-2 text-xs">{c.description}</p>
                          </div>
                          {!c.isActive && <Badge variant="warning">Hidden</Badge>}
                        </div>
                        <p className="text-muted-foreground mt-2 text-xs">
                          {c.subcategories.length} subcategories · {row?.services ?? 0} services ·{" "}
                          {row?.workers ?? 0} professionals
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">
                            {formatINR(row?.revenue ?? 0)} earned
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={c.isActive ? `Hide ${c.name}` : `Publish ${c.name}`}
                              onClick={() => toggleCategory.mutate({ id: c.id, isActive: !c.isActive })}
                            >
                              <Power className={c.isActive ? "text-success" : "text-muted-foreground"} />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Delete ${c.name}`}
                              onClick={() => setPendingDelete({ kind: "category", id: c.id, name: c.name })}
                            >
                              <Trash2 className="text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CategoryFormDialog
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        loading={addCategory.isPending}
        onSubmit={(input) => addCategory.mutate(input)}
      />
      <ServiceFormDialog
        open={serviceFormOpen}
        onOpenChange={setServiceFormOpen}
        categories={categories}
        loading={addService.isPending}
        onSubmit={(input) => addService.mutate(input)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(v) => !v && setPendingDelete(null)}
        title={pendingDelete === null ? "" : `Delete ${pendingDelete.name}?`}
        description={
          pendingDelete?.kind === "category"
            ? "Deleting a category also removes every service inside it. Hide it instead if you want to keep history."
            : "This service will disappear from customer search. Existing bookings keep their saved snapshot."
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() => {
          if (pendingDelete) remove.mutate({ kind: pendingDelete.kind, id: pendingDelete.id });
        }}
      >
        <p className="text-muted-foreground text-sm">This action cannot be undone.</p>
      </ConfirmDialog>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
        <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: CategoryInput) => void;
  loading: boolean;
}) {
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("Sparkles");
  const [description, setDescription] = React.useState("");

  const reset = () => {
    setName("");
    setIcon("Sparkles");
    setDescription("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
          <DialogDescription>
            Categories group related services and drive the customer search filters.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pest Control"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-icon">Icon name</Label>
            <Input
              id="cat-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Lucide icon name, e.g. Bug"
            />
            <p className="text-muted-foreground text-xs">
              Any icon from the KaamWala icon set. Falls back to a neutral icon if unknown.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What customers in this category can book."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            loading={loading}
            disabled={name.trim().length < 3 || description.trim().length < 10}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                icon: icon.trim() || "Sparkles",
                description: description.trim(),
                isActive: true,
              })
            }
          >
            Create category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ServiceFormDialog({
  open,
  onOpenChange,
  categories,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: {
    id: string;
    name: string;
    isActive: boolean;
    subcategories: { id: string; name: string; isActive: boolean }[];
  }[];
  onSubmit: (input: ServiceInput) => void;
  loading: boolean;
}) {
  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [subcategoryId, setSubcategoryId] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [icon, setIcon] = React.useState("Wrench");
  const [description, setDescription] = React.useState("");

  const category = categories.find((c) => c.id === categoryId);
  const subcategories = (category?.subcategories ?? []).filter((s) => s.isActive);

  const reset = () => {
    setName("");
    setCategoryId("");
    setSubcategoryId("");
    setPrice("");
    setIcon("Wrench");
    setDescription("");
  };

  const priceValue = Number(price);
  const valid =
    name.trim().length >= 3 &&
    categoryId !== "" &&
    subcategoryId !== "" &&
    description.trim().length >= 20 &&
    Number.isFinite(priceValue) &&
    priceValue >= 99;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New service</DialogTitle>
          <DialogDescription>
            Services are bookable by customers and can be added to a professional&apos;s price list.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="svc-name">Service name</Label>
            <Input
              id="svc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deep Cleaning – 3BHK"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-category">Category</Label>
            <select
              id="svc-category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubcategoryId("");
              }}
              className="border-border bg-background h-10 w-full rounded-lg border px-3 text-sm"
            >
              <option value="">Select a category</option>
              {categories
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-subcategory">Subcategory</Label>
            <select
              id="svc-subcategory"
              value={subcategoryId}
              disabled={!category}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="border-border bg-background h-10 w-full rounded-lg border px-3 text-sm disabled:opacity-60"
            >
              <option value="">{category ? "Select a subcategory" : "Choose a category first"}</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-price">Starting price (₹)</Label>
            <Input
              id="svc-price"
              type="number"
              min={99}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="499"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-icon">Icon name</Label>
            <Input
              id="svc-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Lucide icon name"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="svc-desc">Description</Label>
            <Textarea
              id="svc-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is included, typical duration and anything the customer should prepare."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            loading={loading}
            disabled={!valid}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                categoryId,
                subcategoryId,
                startingPrice: priceValue,
                icon: icon.trim() || "Wrench",
                description: description.trim(),
                isActive: true,
              })
            }
          >
            Create service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
