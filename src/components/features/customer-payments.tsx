"use client";

import * as React from "react";
import Link from "next/link";
import { CreditCard, Download, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { getPaymentSummary, getWalletBalance } from "@/services/payments";
import { downloadInvoice, printReceipt } from "@/lib/print";
import { formatDateTime, formatINR } from "@/lib/format";
import type { PaymentMethod, Transaction } from "@/types";

const METHODS: { value: PaymentMethod | "ALL"; label: string }[] = [
  { value: "ALL", label: "All methods" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "CASH", label: "Cash" },
  { value: "WALLET", label: "Wallet" },
];

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "info"> = {
  PAID: "success",
  PENDING: "warning",
  REFUNDED: "info",
  FAILED: "destructive",
};

export function CustomerPaymentsPage() {
  const { session } = useAuth();
  const userId = session?.userId;
  const dbVersion = useDbVersion();

  const [method, setMethod] = React.useState<PaymentMethod | "ALL">("ALL");
  const [status, setStatus] = React.useState("ALL");
  const [search, setSearch] = React.useState("");

  const summaryQuery = useApiQuery(
    ["payments", "customer", userId, status, search, dbVersion],
    () =>
      getPaymentSummary({
        customerId: userId,
        status,
        search: search.trim() || undefined,
      }),
    { enabled: Boolean(userId) },
  );

  const walletQuery = useApiQuery(
    ["payments", "wallet", userId, dbVersion],
    () => (userId ? getWalletBalance(userId) : Promise.resolve({ balance: 0, currency: "INR" })),
    { enabled: Boolean(userId) },
  );

  const summary = summaryQuery.data;
  const transactions = React.useMemo(
    () => (summary?.transactions ?? []) as Transaction[],
    [summary],
  );
  // The method tabs filter the loaded page locally so each tab can show an
  // accurate count and switching never re-queries.
  const methodCounts = React.useMemo(() => {
    const counts: Record<string, number> = { ALL: transactions.length };
    for (const t of transactions) counts[t.method] = (counts[t.method] ?? 0) + 1;
    return counts;
  }, [transactions]);
  const visible = method === "ALL" ? transactions : transactions.filter((t) => t.method === method);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Invoices"
        description="Every payment you have made, with downloadable invoices for your records."
        breadcrumbs={[{ label: "Customer", href: "/customer/dashboard" }, { label: "Payments" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CreditCard />}
          label="Total spent"
          value={summary ? formatINR(summary.total) : "—"}
          hint={`${summary?.count ?? 0} payments`}
        />
        <StatCard
          icon={<TrendingUp />}
          label="Service value"
          value={summary ? formatINR(summary.total - summary.fees) : "—"}
          hint="Before platform fee"
        />
        <StatCard
          icon={<Wallet />}
          label="Wallet balance"
          value={summary ? formatINR(walletQuery.data?.balance ?? 0) : "—"}
          hint="Credits available"
        />
        <StatCard
          icon={<Receipt />}
          label="Platform fees"
          value={summary ? formatINR(summary.fees) : "—"}
          hint="Included in bills"
        />
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Transaction history</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice, booking…"
                className="sm:w-56"
                aria-label="Search transactions"
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="sm:w-40" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {summaryQuery.isLoading ? (
            <SectionLoader label="Loading payments…" />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="No payments found"
              description="Once you complete a booking, its payment and invoice will appear here."
              actionLabel="Book a service"
              actionHref="/customer/book/new"
            />
          ) : (
            <Tabs value={method} onValueChange={(v) => setMethod(v as PaymentMethod | "ALL")}>
              <TabsList className="mb-4">
                <TabsTrigger value="ALL">All ({methodCounts.ALL ?? 0})</TabsTrigger>
                {METHODS.filter((m) => m.value !== "ALL").map((m) => (
                  <TabsTrigger key={m.value} value={m.value}>
                    {m.label} ({methodCounts[m.value] ?? 0})
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={method}>
                <TransactionTable transactions={visible} />
              </TabsContent>
            </Tabs>
          )}
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <span className="bg-brand-soft text-brand grid size-10 shrink-0 place-items-center rounded-xl">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
          <p className="truncate text-xl font-semibold">{value}</p>
          <p className="text-muted-foreground text-xs">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  const toast = useToast();
  if (transactions.length === 0) {
    return (
      <EmptyState
        compact
        icon="inbox"
        title="Nothing here yet"
        description="No payments match this method."
      />
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] text-sm">
        <thead>
          <tr className="text-muted-foreground border-b border-border text-left text-xs uppercase tracking-wide">
            <th className="px-3 py-2 font-medium">Invoice</th>
            <th className="px-3 py-2 font-medium">Booking</th>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Method</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
            <th className="px-3 py-2 text-right font-medium">Status</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-accent/40 border-b border-border/60 last:border-0">
              <td className="px-3 py-3">
                <p className="font-medium">{t.invoiceNo}</p>
                <p className="text-muted-foreground text-xs">Ref {t.reference}</p>
              </td>
              <td className="px-3 py-3">
                <Button asChild variant="link" className="h-auto p-0 text-sm">
                  <Link href={`/customer/bookings/${t.bookingId}`}>{t.bookingId}</Link>
                </Button>
              </td>
              <td className="text-muted-foreground px-3 py-3 text-[13px]">{formatDateTime(t.createdAt)}</td>
              <td className="px-3 py-3">
                <Badge variant="outline">{t.method}</Badge>
              </td>
              <td className="px-3 py-3 text-right font-medium tabular-nums">
                {formatINR(t.amount)}
              </td>
              <td className="px-3 py-3 text-right">
                <Badge variant={STATUS_VARIANT[t.status] ?? "info"}>{t.status}</Badge>
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Download invoice ${t.invoiceNo}`}
                    onClick={() => {
                      downloadInvoice(t);
                      toast.success("Invoice downloaded", t.invoiceNo);
                    }}
                  >
                    <Download />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Print receipt ${t.invoiceNo}`}
                    onClick={() => printReceipt(t)}
                  >
                    <Receipt />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
