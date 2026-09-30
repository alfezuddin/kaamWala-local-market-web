"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, Filter, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";

import { useAuth } from "@/components/providers/auth-provider";
import { useApiQuery } from "@/hooks/use-api";
import { getBookings } from "@/services/bookings";
import { getWorkers } from "@/services/workers";
import { formatINR, formatRelativeDay } from "@/lib/format";
import type { Booking, BookingStatus } from "@/types";

const TABS: { value: BookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "REQUESTED", label: "Requests" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "ON_THE_WAY", label: "On the way" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
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

export function WorkerJobsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.userId;

  const [status, setStatus] = React.useState<BookingStatus | "ALL">(
    (params.get("status") as BookingStatus | null) ?? "ALL",
  );
  const [search, setSearch] = React.useState("");
  const [city, setCity] = React.useState("ALL");

  const jobsQuery = useApiQuery(
    ["worker", "jobs", userId, status],
    () => (userId ? getBookings({ workerId: userId, status }) : Promise.resolve<Booking[]>([])),
    { enabled: Boolean(userId) },
  );

  const poolQuery = useApiQuery(["worker", "open-pool"], async () => {
    const rows = await getWorkers({});
    const workers = rows.map((r) => r.worker);
    const open = await getBookings({ status: "REQUESTED" });
    return open.filter((b) => workers.some((w) => w.serviceIds.includes(b.serviceId)));
  });

  const jobs = jobsQuery.data ?? [];
  const cities = Array.from(new Set(jobs.map((j) => j.address.city))).sort();

  const filtered = jobs.filter((job) => {
    if (city !== "ALL" && job.address.city !== city) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.id.toLowerCase().includes(q) ||
      job.address.area.toLowerCase().includes(q)
    );
  });

  const openPool = (poolQuery.data ?? []) as Booking[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My jobs"
        description="Requests assigned to you and the jobs you have completed."
        breadcrumbs={[{ label: "Professional", href: "/worker/dashboard" }, { label: "Jobs" }]}
        actions={
          <Button variant="outline" onClick={() => router.push("/worker/dashboard")} icon={<CalendarCheck />}>
            Back to dashboard
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <Tabs
            value={status}
            onValueChange={(v) => {
              setStatus(v as BookingStatus | "ALL");
              router.replace(v === "ALL" ? "/worker/jobs" : `/worker/jobs?status=${v}`, { scroll: false });
            }}
          >
            <TabsList className="flex-wrap">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by service, booking ID or area…"
              icon={<Search />}
              className="flex-1"
              aria-label="Search jobs"
            />
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="sm:w-52" aria-label="Filter by city">
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All cities</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || city !== "ALL") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setCity("ALL");
                }}
                icon={<X />}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {jobsQuery.isLoading ? (
        <SectionLoader label="Loading jobs…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No jobs here"
          description={
            search || city !== "ALL"
              ? "No jobs match your filters. Try clearing them."
              : "Jobs assigned to you will appear here once a customer books your service."
          }
          actionLabel={search || city !== "ALL" ? "Clear filters" : "Open my services"}
          onAction={search || city !== "ALL" ? () => { setSearch(""); setCity("ALL"); } : undefined}
          actionHref={search || city !== "ALL" ? undefined : "/worker/services"}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {status === "ALL" && openPool.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="text-muted-foreground size-4" />
            <h2 className="text-base font-semibold">Open requests you can take</h2>
            <Badge variant="muted">{openPool.length}</Badge>
          </div>
          <p className="text-muted-foreground text-[13px]">
            These are unassigned requests in your service categories. Contact the customer to offer your slot.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {openPool.slice(0, 6).map((job) => (
              <div key={job.id} className="border-border rounded-xl border p-3">
                <p className="text-sm font-medium">{job.title}</p>
                <p className="text-muted-foreground mt-0.5 text-[13px]">
                  {job.address.area}, {job.address.city} · {formatRelativeDay(job.scheduledDate)} at{" "}
                  {job.scheduledTime}
                </p>
                <p className="mt-1 text-[13px] font-medium">{formatINR(job.price + job.visitCharge)}</p>
                <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                  <a href={`/customer/bookings/${job.id}`}>View details</a>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function JobCard({ job }: { job: Booking }) {
  const total = job.price + job.visitCharge;
  return (
    <Card className="transition hover:border-brand/40">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">{job.title}</span>
            <Badge variant={VARIANT[job.status]}>{job.status.replace("_", " ")}</Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[13px]">
            {job.id} · {job.address.area}, {job.address.city} {job.address.pincode}
          </p>
          <p className="mt-0.5 text-[13px]">
            {formatRelativeDay(job.scheduledDate)} at {job.scheduledTime}
            {job.isFlexible ? " · flexible timing" : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{formatINR(total)}</p>
            <p className="text-muted-foreground text-xs">
              {job.paymentStatus === "PAID" ? "Paid" : "Payment pending"}
            </p>
          </div>
          <Button asChild size="sm">
            <a href={`/worker/jobs/${job.id}`}>
              {job.status === "REQUESTED" ? "Review" : "Open"}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
