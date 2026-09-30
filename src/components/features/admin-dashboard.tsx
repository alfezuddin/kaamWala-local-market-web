"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  IndianRupee,
  MessageSquareWarning,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { RatingStars } from "@/components/ui/rating-stars";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { InfoBanner, PageHeader, SectionCard } from "@/components/ui/dashboard-shell";
import { useApiQuery } from "@/hooks/use-api";
import { getAdminDashboard } from "@/services/admin";
import { formatINR, formatTimeAgo } from "@/lib/format";

export function AdminDashboardPage() {
  const query = useApiQuery(["admin", "dashboard"], () => getAdminDashboard());

  if (query.isLoading) return <SectionLoader label="Loading the admin console…" />;
  if (!query.data) {
    return (
      <EmptyState
        icon="inbox"
        title="Dashboard unavailable"
        description="We could not load platform data. Try again in a moment."
        actionLabel="Retry"
        onAction={() => query.refetch()}
      />
    );
  }

  const { stats, series, categoryDistribution, recentBookings, recentWorkers, recentComplaints } = query.data;
  const maxBookings = Math.max(...series.map((p) => p.bookings), 1);
  const maxCategory = Math.max(...categoryDistribution.map((c) => c.value), 1);
  const totalCategory = categoryDistribution.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Live snapshot of bookings, revenue and marketplace health."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Dashboard" }]}
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/reports">
              Full reports <ArrowUpRight />
            </Link>
          </Button>
        }
      />

      {(stats.pendingVerification > 0 || stats.openComplaints > 0) && (
        <InfoBanner
          variant="warning"
          icon={<AlertTriangle />}
          title="Items need your attention"
          description={`${stats.pendingVerification} professional verification${stats.pendingVerification === 1 ? "" : "s"} and ${stats.openComplaints} open complaint${stats.openComplaints === 1 ? "" : "s"} are waiting for review.`}
          action={
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/verifications">Verifications</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/admin/complaints">Complaints</Link>
              </Button>
            </div>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<IndianRupee />}
          label="Platform revenue"
          value={formatINR(stats.revenue)}
          hint={`GMV ${formatINR(stats.gmv)}`}
        />
        <StatCard
          icon={<CalendarCheck />}
          label="Bookings"
          value={String(stats.bookings)}
          hint={`${stats.completed} completed · ${stats.cancelled} cancelled`}
        />
        <StatCard
          icon={<Users />}
          label="Customers"
          value={String(stats.customers)}
          hint="Registered accounts"
        />
        <StatCard
          icon={<Wrench />}
          label="Professionals"
          value={String(stats.workers)}
          hint={`${stats.pendingVerification} pending verification`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Bookings over time</CardTitle>
              <Badge variant="success">
                <TrendingUp className="size-3" /> Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-52 items-end gap-1.5" role="img" aria-label="Bookings over time chart">
              {series.map((point) => (
                <div key={point.month} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span className="text-muted-foreground text-[10px] tabular-nums opacity-0 transition group-hover:opacity-100">
                    {point.bookings}
                  </span>
                  <div
                    className="bg-brand/85 hover:bg-brand w-full rounded-t-md transition"
                    style={{ height: `${Math.max(4, (point.bookings / maxBookings) * 100)}%` }}
                    title={`${point.month}: ${point.bookings} bookings`}
                  />
                  <span className="text-muted-foreground truncate text-[10px]">{point.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bookings by category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {categoryDistribution.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="truncate font-medium">{c.name}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {c.value} · {totalCategory === 0 ? 0 : Math.round((c.value / totalCategory) * 100)}%
                  </span>
                </div>
                <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-brand h-full rounded-full"
                    style={{ width: `${(c.value / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <SectionCard
        title="Recent bookings"
        description="The six most recent jobs across the platform."
        icon={<CalendarCheck />}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/bookings">View all</Link>
          </Button>
        }
      >
        {recentBookings.length === 0 ? (
          <EmptyState compact icon="inbox" title="No bookings yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border text-left text-xs uppercase tracking-wide">
                  <th className="px-3 py-2 font-medium">Booking</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Professional</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-accent/40 border-b border-border/60 last:border-0">
                    <td className="px-3 py-3">
                      <Button asChild variant="link" className="h-auto p-0 text-sm">
                        <Link href={`/admin/bookings/${b.id}`}>{b.id}</Link>
                      </Button>
                      <p className="text-muted-foreground text-xs">{b.title}</p>
                    </td>
                    <td className="px-3 py-3">{b.customer?.name ?? "—"}</td>
                    <td className="px-3 py-3">{b.worker?.name ?? "Unassigned"}</td>
                    <td className="px-3 py-3">
                      <Badge variant={b.status === "COMPLETED" ? "success" : b.status === "CANCELLED" ? "destructive" : "info"}>
                        {b.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {formatINR(b.price + b.visitCharge)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Newest professionals"
          icon={<Wrench />}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/workers">Manage</Link>
            </Button>
          }
        >
          <ul className="space-y-3">
            {recentWorkers.map((w) => (
              <li key={w.id} className="flex items-center gap-3">
                <AvatarCircle name={w.name} size="md" online={w.isOnline ?? false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{w.name}</p>
                  <p className="text-muted-foreground truncate text-[13px]">
                    {w.headline} · {w.area}, {w.city}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge
                    variant={
                      w.verification === "APPROVED" ? "success" : w.verification === "REJECTED" ? "destructive" : "warning"
                    }
                  >
                    {w.verification}
                  </Badge>
                  {w.reviewCount > 0 && (
                    <span className="flex items-center gap-1">
                      <RatingStars value={w.rating} size="xs" />
                      <span className="text-muted-foreground text-xs">({w.reviewCount})</span>
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Recent complaints"
          icon={<MessageSquareWarning />}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/complaints">Resolve</Link>
            </Button>
          }
        >
          {recentComplaints.length === 0 ? (
            <EmptyState compact icon="alert" title="No complaints" description="Nothing needs escalation right now." />
          ) : (
            <ul className="space-y-3">
              {recentComplaints.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.subject}</p>
                    <p className="text-muted-foreground text-[13px]">
                      Booking {c.bookingId} · {formatTimeAgo(c.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={c.status === "RESOLVED" ? "success" : c.status === "OPEN" ? "destructive" : "warning"}
                    className="shrink-0"
                  >
                    {c.status.replace("_", " ")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <InfoBanner
        variant="info"
        icon={<ShieldCheck />}
        title="Data shown is from the demo dataset"
        description="All records are seeded locally in your browser. Connect the service layer in src/services to your production API to switch to live data."
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <span className="bg-brand-soft text-brand grid size-10 shrink-0 place-items-center rounded-xl">{icon}</span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
          <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
