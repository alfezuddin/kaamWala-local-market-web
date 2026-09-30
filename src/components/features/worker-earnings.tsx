"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, IndianRupee, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { getWorkerEarnings } from "@/services/workers";
import { printHtml, receiptHtml } from "@/lib/print";
import { formatDate, formatINR } from "@/lib/format";
import type { Transaction } from "@/types";

type Row = Transaction & { booking: { id: string; title: string; scheduledDate: string } | null };

export function WorkerEarningsPage() {
  const toast = useToast();
  const { session } = useAuth();
  const userId = session?.userId;
  const dbVersion = useDbVersion();
  const [range, setRange] = React.useState<"week" | "month" | "all">("month");

  const query = useApiQuery(
    ["worker", "earnings", userId, dbVersion],
    () => (userId ? getWorkerEarnings(userId) : Promise.resolve(null)),
    { enabled: Boolean(userId) },
  );

  if (query.isLoading) return <SectionLoader label="Loading earnings…" />;
  if (!query.data) {
    return (
      <EmptyState
        icon="inbox"
        title="No earnings data"
        description="Complete your first job to start earning."
        actionLabel="View jobs"
        actionHref="/worker/jobs"
      />
    );
  }

  const { transactions, totals, series, completedJobs } = query.data;
  const rows = transactions as Row[];
  const maxValue = Math.max(...series.map((p) => p.earnings), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings"
        description="Your payout history and income trend across completed jobs."
        breadcrumbs={[{ label: "Professional", href: "/worker/dashboard" }, { label: "Earnings" }]}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              if (rows.length === 0) {
                toast.warning("Nothing to export", "Complete a job to generate payout receipts.");
                return;
              }
              printHtml(receiptHtml(rows[0]));
            }}
            icon={<Receipt />}
          >
            Print latest receipt
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<IndianRupee />} label="Earned today" value={formatINR(totals.today)} />
        <StatCard icon={<TrendingUp />} label="This period" value={formatINR(range === "all" ? totals.total : totals[range])} />
        <StatCard icon={<Wallet />} label="All time" value={formatINR(totals.total)} />
        <StatCard
          icon={<Receipt />}
          label="Platform fees"
          value={formatINR(totals.commissionPaid)}
          hint={`${totals.jobs} paid jobs · ${completedJobs} completed`}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Income trend</CardTitle>
            <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <TabsList>
                <TabsTrigger value="week">This week</TabsTrigger>
                <TabsTrigger value="month">This month</TabsTrigger>
                <TabsTrigger value="all">All time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Earnings trend chart">
            {series.map((point) => (
              <div key={point.day} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-muted-foreground text-[10px] tabular-nums opacity-0 transition group-hover:opacity-100">
                  {formatINR(point.earnings, { compact: true })}
                </span>
                <div
                  className="bg-brand/85 hover:bg-brand w-full rounded-t-md transition"
                  style={{ height: `${Math.max(4, (point.earnings / maxValue) * 100)}%` }}
                  title={`${point.day}: ${formatINR(point.earnings)} across ${point.jobs} jobs`}
                />
                <span className="text-muted-foreground truncate text-[10px]">{point.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              compact
              icon="inbox"
              title="No payouts yet"
              description="Your earnings appear here after you complete a paid job."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border text-left text-xs uppercase tracking-wide">
                    <th className="px-3 py-2 font-medium">Job</th>
                    <th className="px-3 py-2 font-medium">Visit date</th>
                    <th className="px-3 py-2 font-medium">Method</th>
                    <th className="px-3 py-2 text-right font-medium">Gross</th>
                    <th className="px-3 py-2 text-right font-medium">Fee</th>
                    <th className="px-3 py-2 text-right font-medium">Your earning</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="hover:bg-accent/40 border-b border-border/60 last:border-0">
                      <td className="px-3 py-3">
                        {t.booking ? (
                          <Button asChild variant="link" className="h-auto p-0 text-sm">
                            <Link href={`/worker/jobs/${t.bookingId}`}>{t.booking.title}</Link>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">{t.bookingId}</span>
                        )}
                      </td>
                      <td className="text-muted-foreground px-3 py-3 text-[13px]">
                        {t.booking ? formatDate(t.booking.scheduledDate) : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline">{t.method}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatINR(t.amount)}</td>
                      <td className="text-destructive px-3 py-3 text-right tabular-nums">
                        −{formatINR(t.platformFee)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">
                        {formatINR(t.workerEarning)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-2.5">
          <ArrowUpRight className="text-success mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            Earnings are credited to your KaamWala wallet. Payouts settle to your registered bank account every
            Monday for jobs completed the previous week.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  down,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  down?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <span
          className={
            down
              ? "bg-destructive/10 text-destructive grid size-10 shrink-0 place-items-center rounded-xl"
              : "bg-brand-soft text-brand grid size-10 shrink-0 place-items-center rounded-xl"
          }
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
          <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
