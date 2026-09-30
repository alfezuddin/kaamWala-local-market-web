"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, Download, MapPin, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionLoader } from "@/components/ui/states";
import { InfoBanner, PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { getReports } from "@/services/admin";
import { exportRowsToCsv } from "@/lib/csv";
import { formatINR } from "@/lib/format";

export function AdminReportsPage() {
  const toast = useToast();
  const dbVersion = useDbVersion();
  const query = useApiQuery(["admin", "reports", dbVersion], () => getReports());
  const [range, setRange] = React.useState<"30" | "90">("30");

  if (query.isLoading) return <SectionLoader label="Building reports…" />;
  if (!query.data) {
    return (
      <InfoBanner
        variant="warning"
        title="Reports unavailable"
        description="The reporting service did not respond. Please reload the page."
      />
    );
  }

  const { series, revenueByCategory, cityStats, totals } = query.data;
  const windowSize = range === "30" ? 6 : 12;
  const visible = series.slice(-windowSize);
  const maxRevenue = Math.max(...visible.map((s) => s.revenue), 1);

  const topRevenue = [...revenueByCategory].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const maxCatRevenue = Math.max(...topRevenue.map((c) => c.revenue), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Revenue, demand and marketplace health across cities and categories."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Reports" }]}
        actions={
          <>
            <div className="border-border bg-card flex rounded-lg border p-0.5">
              {(["30", "90"] as const).map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={range === r ? "secondary" : "ghost"}
                  onClick={() => setRange(r)}
                >
                  {r} days
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                exportRowsToCsv(
                  "monthly-report.csv",
                  series.map((s) => ({
                    month: s.month,
                    bookings: s.bookings,
                    revenue: s.revenue,
                    customers: s.customers,
                    workers: s.workers,
                  })),
                );
                toast.success("Report downloaded", `${series.length} months of data exported.`);
              }}
              icon={<Download />}
            >
              Export
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total bookings" value={String(totals.bookings)} />
        <Metric label="Completed revenue" value={formatINR(totals.revenue)} icon={<TrendingUp />} />
        <Metric label="Average booking value" value={formatINR(totals.avgOrderValue)} />
        <Metric label="Completion rate" value={`${totals.completionRate}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Monthly revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[260px] items-end gap-2">
              {visible.map((s) => (
                <div key={s.month} className="group flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-muted-foreground text-[11px] tabular-nums opacity-0 transition group-hover:opacity-100">
                    {formatINR(s.revenue)}
                  </span>
                  <div
                    className="bg-brand/80 hover:bg-brand w-full rounded-t-md transition"
                    style={{ height: `${Math.max(6, (s.revenue / maxRevenue) * 190)}px` }}
                    title={`${s.month}: ${formatINR(s.revenue)}`}
                  />
                  <span className="text-muted-foreground text-[11px]">{s.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Volume trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visible.map((s) => (
                <div key={s.month} className="space-y-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">{s.month}</span>
                    <span className="font-medium tabular-nums">
                      {s.bookings} bookings · {s.customers} new customers
                    </span>
                  </div>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-info h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (s.bookings / Math.max(...visible.map((v) => v.bookings), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topRevenue.map((c) => (
              <div key={c.name} className="space-y-1">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatINR(c.revenue)} · {c.bookings} bookings
                  </span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-brand h-full rounded-full"
                    style={{ width: `${Math.max(4, (c.revenue / maxCatRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">City coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y">
              {cityStats.map((c) => (
                <li key={c.city} className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-2 text-sm">
                    <MapPin className="text-muted-foreground size-4" />
                    {c.city}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-2 text-[13px]">
                    <Badge variant="outline" className="gap-1">
                      <Building2 className="size-3" />
                      {c.workers}
                    </Badge>
                    <Badge variant="secondary">{c.bookings} jobs</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top professionals</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-border divide-y">
            {totals.topWorkers.map((w, i) => (
              <li key={w.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-muted-foreground w-5 text-sm tabular-nums">#{i + 1}</span>
                  <div className="min-w-0">
                    <Button asChild variant="link" className="h-auto p-0 text-sm">
                      <Link href={`/admin/workers?q=${encodeURIComponent(w.name)}`}>{w.name}</Link>
                    </Button>
                    <p className="text-muted-foreground truncate text-xs">
                      {w.headline} · {w.area}, {w.city}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[13px]">
                  <Badge variant="success">{w.completedJobs} jobs</Badge>
                  <Badge variant="outline">{w.rating.toFixed(1)} ★</Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <InfoBanner
        variant="info"
        title="How these numbers are calculated"
        description="Revenue counts completed bookings only and excludes GST. Commission and payouts are tracked separately under Payments."
      />
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground flex items-center gap-1.5 text-[13px] font-medium">
          {icon}
          {label}
        </p>
        <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
