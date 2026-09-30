"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { getAdminBookings, getAdminBookingStats } from "@/services/bookings";
import { getCategories } from "@/services/catalog";
import { exportRowsToCsv } from "@/lib/csv";
import { formatDateTime, formatINR, formatRelativeDay } from "@/lib/format";
import type { Booking, BookingStatus } from "@/types";

const STATUS_TABS: { value: BookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "REQUESTED", label: "Requested" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "ON_THE_WAY", label: "On the way" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REJECTED", label: "Rejected" },
];

const VARIANT: Record<string, "warning" | "info" | "brand" | "success" | "destructive"> = {
  REQUESTED: "warning",
  ACCEPTED: "info",
  CONFIRMED: "info",
  ON_THE_WAY: "brand",
  IN_PROGRESS: "brand",
  COMPLETED: "success",
  CANCELLED: "destructive",
  REJECTED: "destructive",
};

type Row = Booking & {
  customer: { id: string; name: string } | null;
  worker: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
};

export function AdminBookingsPage() {
  const router = useRouter();
  const toast = useToast();
  const dbVersion = useDbVersion();

  const [status, setStatus] = React.useState<BookingStatus | "ALL">("ALL");
  const [search, setSearch] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("ALL");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const query = useApiQuery(
    ["admin", "bookings", status, search, categoryId, from, to, dbVersion],
    () =>
      getAdminBookings({
        status,
        search: search.trim() || undefined,
        categoryId: categoryId === "ALL" ? undefined : categoryId,
        from: from || undefined,
        to: to || undefined,
      }),
  );

  const statsQuery = useApiQuery(["admin", "booking-stats", dbVersion], () => getAdminBookingStats());
  const categoriesQuery = useApiQuery(["catalog", "categories"], () => getCategories());

  const rows = (query.data ?? []) as Row[];
  const hasFilters = search || categoryId !== "ALL" || from || to;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Every job on the platform, with status, payment and assignment."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Bookings" }]}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              if (rows.length === 0) {
                toast.warning("Nothing to export", "No bookings match your filters.");
                return;
              }
              exportRowsToCsv(
                "bookings.csv",
                rows.map((b) => ({
                  id: b.id,
                  title: b.title,
                  customer: b.customer?.name ?? "",
                  worker: b.worker?.name ?? "",
                  service: b.service?.name ?? "",
                  status: b.status,
                  payment: b.paymentStatus,
                  value: b.price + b.visitCharge,
                  scheduled: `${b.scheduledDate} ${b.scheduledTime}`,
                })),
              );
              toast.success("Export ready", `${rows.length} bookings downloaded.`);
            }}
            icon={<Download />}
          >
            Export CSV
          </Button>
        }
      />

      {statsQuery.data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Total bookings" value={String(statsQuery.data.total)} />
          <MiniStat label="Completed" value={String(statsQuery.data.completed)} />
          <MiniStat label="Cancelled" value={String(statsQuery.data.cancelled)} />
          <MiniStat label="Booking value" value={formatINR(statsQuery.data.gmv)} />
        </div>
      )}

      <Card>
        <CardContent className="space-y-4">
          <Tabs
            value={status}
            onValueChange={(v) => {
              setStatus(v as BookingStatus | "ALL");
              router.replace(v === "ALL" ? "/admin/bookings" : `/admin/bookings?status=${v}`, { scroll: false });
            }}
          >
            <TabsList className="flex-wrap">
              {STATUS_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search booking, customer, worker…"
              icon={<Search />}
              className="lg:col-span-2"
              aria-label="Search bookings"
            />
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger aria-label="Filter by category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {(categoriesQuery.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setCategoryId("ALL");
                setFrom("");
                setTo("");
              }}
              icon={<X />}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {query.isLoading ? (
        <SectionLoader label="Loading bookings…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No bookings found"
          description={hasFilters ? "No bookings match your filters." : "Bookings will appear here as customers book services."}
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[60rem] text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border text-left text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Booking</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Professional</th>
                  <th className="px-4 py-3 font-medium">Scheduled</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-accent/40 border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <Button asChild variant="link" className="h-auto p-0 text-sm">
                        <Link href={`/admin/bookings/${b.id}`}>{b.id}</Link>
                      </Button>
                      <p className="text-muted-foreground max-w-48 truncate text-xs">
                        {b.service?.name ?? b.title}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {b.customer ? (
                        <Button asChild variant="link" className="h-auto p-0 text-sm">
                          <Link href={`/admin/customers?q=${encodeURIComponent(b.customer.name)}`}>
                            {b.customer.name}
                          </Link>
                        </Button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {b.worker ? (
                        <Button asChild variant="link" className="h-auto p-0 text-sm">
                          <Link href={`/admin/workers?q=${encodeURIComponent(b.worker.name)}`}>
                            {b.worker.name}
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-[13px]">
                      {formatRelativeDay(b.scheduledDate)}
                      <br />
                      {b.scheduledTime}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={VARIANT[b.status]}>{b.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={b.paymentStatus === "PAID" ? "success" : b.paymentStatus === "REFUNDED" ? "info" : "warning"}>
                        {b.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatINR(b.price + b.visitCharge)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground text-[13px]">
        Showing {rows.length} bookings · last synced {formatDateTime(new Date().toISOString())}
      </p>
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
