"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Receipt, Search, TrendingUp, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getPaymentSummary } from "@/services/payments";
import { exportRowsToCsv } from "@/lib/csv";
import { downloadInvoice } from "@/lib/print";
import { formatDateTime, formatINR } from "@/lib/format";
import type { PaymentMethod, Transaction } from "@/types";

type Row = Transaction & {
  customer: { id: string; name: string } | null;
  worker: { id: string; name: string } | null;
  booking: { id: string; title: string } | null;
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "info"> = {
  PAID: "success",
  PENDING: "warning",
  REFUNDED: "info",
  FAILED: "destructive",
};

export function AdminPaymentsPage() {
  const toast = useToast();
  const dbVersion = useDbVersion();
  const [status, setStatus] = React.useState("ALL");
  const [method, setMethod] = React.useState<PaymentMethod | "ALL">("ALL");
  const [search, setSearch] = React.useState("");

  const query = useApiQuery(
    ["admin", "payments", status, method, search, dbVersion],
    () =>
      getPaymentSummary({
        status,
        method,
        search: search.trim() || undefined,
      }),
  );

  const rows = (query.data?.transactions ?? []) as Row[];
  const totals = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="All platform transactions, platform fees and payouts."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Payments" }]}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              if (rows.length === 0) {
                toast.warning("Nothing to export", "No transactions match your filters.");
                return;
              }
              exportRowsToCsv(
                "payments.csv",
                rows.map((t) => ({
                  invoice: t.invoiceNo,
                  reference: t.reference,
                  booking: t.bookingId,
                  customer: t.customer?.name ?? "",
                  worker: t.worker?.name ?? "",
                  method: t.method,
                  status: t.status,
                  amount: t.amount,
                  platformFee: t.platformFee,
                  workerEarning: t.workerEarning,
                  createdAt: t.createdAt,
                })),
              );
              toast.success("Export ready", `${rows.length} transactions downloaded.`);
            }}
            icon={<Download />}
          >
            Export CSV
          </Button>
        }
      />

      {totals && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent>
              <p className="text-muted-foreground text-[13px] font-medium">Gross volume</p>
              <p className="truncate text-xl font-semibold tabular-nums">{formatINR(totals.total)}</p>
              <p className="text-muted-foreground text-xs">{totals.count} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-muted-foreground text-[13px] font-medium">Platform revenue</p>
              <p className="text-success truncate text-xl font-semibold tabular-nums">{formatINR(totals.fees)}</p>
              <p className="text-muted-foreground text-xs">
                {totals.total === 0 ? 0 : ((totals.fees / totals.total) * 100).toFixed(1)}% take rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-muted-foreground text-[13px] font-medium">Professional payouts</p>
              <p className="truncate text-xl font-semibold tabular-nums">{formatINR(totals.earnings)}</p>
              <p className="text-muted-foreground text-xs">Settled weekly</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-muted-foreground text-[13px] font-medium">Average booking</p>
              <p className="truncate text-xl font-semibold tabular-nums">
                {formatINR(totals.count === 0 ? 0 : Math.round(totals.total / totals.count))}
              </p>
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <TrendingUp className="size-3" /> across all methods
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Transactions</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice, reference, booking…"
                icon={<Search />}
                className="sm:w-64"
                aria-label="Search transactions"
              />
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod | "ALL")}>
                <SelectTrigger className="sm:w-40" aria-label="Filter by method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All methods</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="WALLET">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Tabs value={status} onValueChange={setStatus}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PAID">Paid</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="REFUNDED">Refunded</TabsTrigger>
              <TabsTrigger value="FAILED">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <SectionLoader label="Loading transactions…" />
          ) : rows.length === 0 ? (
            <EmptyState icon="inbox" title="No transactions found" description="Try a different filter or search term." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[60rem] text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border text-left text-xs uppercase tracking-wide">
                    <th className="px-3 py-2 font-medium">Invoice</th>
                    <th className="px-3 py-2 font-medium">Booking</th>
                    <th className="px-3 py-2 font-medium">Parties</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Method</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="px-3 py-2 text-right font-medium">Fee</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="hover:bg-accent/40 border-b border-border/60 last:border-0">
                      <td className="px-3 py-3">
                        <p className="font-medium">{t.invoiceNo}</p>
                        <p className="text-muted-foreground text-xs">Ref {t.reference}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Button asChild variant="link" className="h-auto p-0 text-sm">
                          <Link href={`/admin/bookings/${t.bookingId}`}>{t.bookingId}</Link>
                        </Button>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[13px]">{t.customer?.name ?? "—"}</p>
                        <p className="text-muted-foreground text-xs">to {t.worker?.name ?? "—"}</p>
                      </td>
                      <td className="text-muted-foreground px-3 py-3 text-[13px]">
                        {formatDateTime(t.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="outline">{t.method}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">
                        {formatINR(t.amount)}
                      </td>
                      <td className="text-success px-3 py-3 text-right tabular-nums">
                        {formatINR(t.platformFee)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={STATUS_VARIANT[t.status] ?? "info"}>{t.status}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Download invoice ${t.invoiceNo}`}
                          onClick={() => {
                            downloadInvoice(t);
                            toast.success("Invoice downloaded", t.invoiceNo);
                          }}
                        >
                          <Receipt />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(search || status !== "ALL" || method !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearch("");
                setStatus("ALL");
                setMethod("ALL");
              }}
              icon={<X />}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
