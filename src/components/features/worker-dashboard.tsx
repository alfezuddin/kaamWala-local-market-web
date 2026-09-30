"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  IndianRupee,
  MapPin,
  ShieldCheck,
  Star,
  
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { RatingStars } from "@/components/ui/rating-stars";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { InfoBanner, PageHeader } from "@/components/ui/dashboard-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiQuery } from "@/hooks/use-api";
import { getWorkerDashboard } from "@/services/workers";
import { formatINR, formatRelativeDay, formatTimeAgo, todayKey } from "@/lib/format";
import type { Booking } from "@/types";

export function WorkerDashboardPage() {
  const { session } = useAuth();
  const userId = session?.userId;

  const query = useApiQuery(
    ["worker", "dashboard", userId],
    () => (userId ? getWorkerDashboard(userId) : Promise.resolve(null)),
    { enabled: Boolean(userId) },
  );

  if (query.isLoading) return <SectionLoader label="Loading your dashboard…" />;

  const data = query.data;
  const worker = data?.worker ?? null;
  if (!worker) {
    return (
      <EmptyState
        icon="inbox"
        title="Profile not found"
        description="We could not load your professional profile. Please sign in again."
        actionLabel="Sign in"
        actionHref="/login"
      />
    );
  }

  const today = todayKey();
  const nextJob = [...(data?.active ?? [])].sort((a, b) =>
    `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`),
  )[0];
  const todayJobs = (data?.todayBookings ?? []).filter((b) =>
    ["ACCEPTED", "CONFIRMED", "ON_THE_WAY", "IN_PROGRESS"].includes(b.status),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Namaste, ${worker.name.split(" ")[0]}`}
        description="Here's how your day looks and what needs your attention."
        breadcrumbs={[{ label: "Professional", href: "/worker/dashboard" }, { label: "Dashboard" }]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/worker/availability">Set availability</Link>
            </Button>
            <Button asChild>
              <Link href="/worker/jobs">
                View all jobs <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />

      {worker.verification !== "APPROVED" && (
        <InfoBanner
          variant={worker.verification === "REJECTED" ? "warning" : "info"}
          icon={<ShieldCheck />}
          title={worker.verification === "REJECTED" ? "Verification was not approved" : "Complete your verification"}
          description={
            worker.verification === "REJECTED"
              ? (worker.rejectionReason ?? "Review your documents and resubmit from your profile.")
              : "Upload your Aadhaar, PAN and a photo to start receiving priority job requests."
          }
          action={
            <Button asChild size="sm" variant={worker.verification === "REJECTED" ? "default" : "outline"}>
              <Link href="/worker/profile">Manage documents</Link>
            </Button>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CalendarCheck />}
          label="Jobs today"
          value={String(todayJobs.length)}
          hint={`${data?.pending.length ?? 0} new request${(data?.pending.length ?? 0) === 1 ? "" : "s"}`}
        />
        <StatCard
          icon={<IndianRupee />}
          label="Earned today"
          value={formatINR(data?.earningsToday ?? 0)}
          hint={`${formatINR(data?.totalEarnings ?? 0)} all time`}
        />
        <StatCard
          icon={<CheckCircle2 />}
          label="Completed jobs"
          value={String(worker.completedJobs)}
          hint={`${worker.cancelledJobs} cancelled`}
        />
        <StatCard
          icon={<Star />}
          label="Your rating"
          value={worker.rating.toFixed(1)}
          hint={`${worker.reviewCount} reviews`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Today&apos;s schedule</CardTitle>
              <Badge variant="outline">{formatRelativeDay(today)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {(data?.todayBookings ?? []).length === 0 ? (
              <EmptyState
                compact
                icon="book"
                title="No jobs scheduled today"
                description="Accept an open request to fill your day."
                actionLabel="Browse open requests"
                actionHref="/worker/jobs?status=REQUESTED"
              />
            ) : (
              <ul className="space-y-3">
                {data!.todayBookings.map((booking) => (
                  <JobRow key={booking.id} booking={booking} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New requests</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.pending.length ?? 0) === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No open requests right now. We will notify you as soon as one matches your services.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data!.pending.slice(0, 4).map((booking) => (
                    <li key={booking.id} className="border-border rounded-xl border p-3">
                      <p className="text-sm font-medium">{booking.title}</p>
                      <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[13px]">
                        <MapPin className="size-3.5" />
                        {booking.address.area}, {booking.address.city}
                      </p>
                      <p className="mt-1 text-[13px]">
                        {formatRelativeDay(booking.scheduledDate)} at {booking.scheduledTime} ·{" "}
                        <span className="font-medium">{formatINR(booking.price + booking.visitCharge)}</span>
                      </p>
                      <Button asChild size="sm" className="mt-2 w-full">
                        <Link href={`/worker/jobs/${booking.id}`}>Review request</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3">
              <AvatarCircle name={worker.name} size="lg" online={worker.isOnline ?? true} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{worker.name}</p>
                <p className="text-muted-foreground truncate text-[13px]">{worker.headline}</p>
                <div className="mt-1 flex items-center gap-2">
                  <RatingStars value={worker.rating} size="sm" />
                  <span className="text-muted-foreground text-xs">({worker.reviewCount})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {nextJob && (
        <Card className="border-brand/30 bg-brand-soft/20">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium uppercase">Next up</p>
              <p className="mt-0.5 truncate text-base font-semibold">{nextJob.title}</p>
              <p className="text-muted-foreground mt-0.5 text-[13px]">
                {formatRelativeDay(nextJob.scheduledDate)} at {nextJob.scheduledTime} · {nextJob.address.area},{" "}
                {nextJob.address.city}
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link href={`/worker/jobs/${nextJob.id}`}>Open job</Link>
            </Button>
          </CardContent>
        </Card>
      )}
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
        <span className="bg-brand-soft text-brand grid size-10 shrink-0 place-items-center rounded-xl">{icon}</span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
          <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
          <p className="text-muted-foreground text-xs">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function JobRow({ booking }: { booking: Booking }) {
  return (
    <li className="border-border flex items-start gap-3 rounded-xl border p-3">
      <div className="bg-muted text-muted-foreground grid size-11 shrink-0 place-items-center rounded-xl text-sm font-semibold">
        {booking.scheduledTime}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/worker/jobs/${booking.id}`} className="truncate text-sm font-medium hover:text-brand">
            {booking.title}
          </Link>
          <Badge variant={statusVariant(booking.status)}>{booking.status.replace("_", " ")}</Badge>
        </div>
        <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px]">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {booking.address.area}, {booking.address.city}
          </span>
          <span className="font-medium">{formatINR(booking.price + booking.visitCharge)}</span>
          {booking.workerEta ? <span>ETA {booking.workerEta} min</span> : null}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">Booked {formatTimeAgo(booking.createdAt)}</p>
      </div>
      <Button asChild variant="ghost" size="sm" className="shrink-0">
        <Link href={`/worker/jobs/${booking.id}`}>Open</Link>
      </Button>
    </li>
  );
}

function statusVariant(status: string) {
  switch (status) {
    case "REQUESTED":
      return "warning" as const;
    case "ACCEPTED":
    case "CONFIRMED":
      return "info" as const;
    case "ON_THE_WAY":
    case "IN_PROGRESS":
      return "brand" as const;
    case "COMPLETED":
      return "success" as const;
    default:
      return "destructive" as const;
  }
}
