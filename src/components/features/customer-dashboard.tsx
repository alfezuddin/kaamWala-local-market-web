"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Compass,
  IndianRupee,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { ServiceCard } from "@/components/ui/service-card";
import { EmptyState, ErrorState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiQuery } from "@/hooks/use-api";
import { getCustomerDashboard } from "@/services/bookings";
import { formatDate, formatINR, formatNumber, formatRelativeDay } from "@/lib/format";
import { useDbVersion } from "@/hooks/use-mounted";

export function CustomerDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.userId;
  const dbVersion = useDbVersion();

  const query = useApiQuery(
    ["customer", "dashboard", userId, dbVersion],
    () => (userId ? getCustomerDashboard(userId) : Promise.resolve(null)),
    { enabled: Boolean(userId) },
  );

  if (query.isLoading) return <SectionLoader label="Loading your dashboard…" />;
  if (query.isError) {
    return <ErrorState onRetry={() => query.refetch()} />;
  }
  const data = query.data;
  if (!data) return null;

  const firstName = data.customer?.name.split(" ")[0] ?? session?.name.split(" ")[0] ?? "there";
  const nextBooking = data.recent.find(
    (b) => ["REQUESTED", "ACCEPTED", "CONFIRMED", "ON_THE_WAY", "IN_PROGRESS"].includes(b.status),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Namaste, ${firstName}`}
        description="Track your bookings, discover new services and keep everything in one place."
        actions={
          <Button asChild icon={<CalendarPlus />}>
            <Link href="/customer/book/new">Book a service</Link>
          </Button>
        }
      />

      {nextBooking ? (
        <Card className="border-brand/30 bg-brand-soft/40">
          <CardContent className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
            <div className="bg-brand text-brand-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
              <CalendarClock className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Next up: {nextBooking.title}</p>
              <p className="text-muted-foreground mt-0.5 text-[13px]">
                {formatDate(nextBooking.scheduledDate)} at {nextBooking.scheduledTime}
                {nextBooking.worker ? ` · with ${nextBooking.worker.name}` : " · awaiting worker assignment"}
              </p>
            </div>
            <StatusBadge status={nextBooking.status} />
            <Button size="sm" variant="outline" asChild icon={<ArrowRight />}>
              <Link href={`/customer/bookings/${nextBooking.id}`}>Track</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
            <div className="bg-brand-soft text-brand-soft-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
              <CalendarPlus className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">No active bookings</p>
              <p className="text-muted-foreground mt-0.5 text-[13px]">
                Book a verified professional and track the job from request to completion.
              </p>
            </div>
            <Button size="sm" asChild icon={<Compass />}>
              <Link href="/services">Explore services</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active bookings"
          value={formatNumber(data.stats.active)}
          icon={<CalendarClock />}
          href="/customer/bookings"
          hint={data.stats.active > 0 ? "In Progress" : undefined}
        />
        <StatCard
          label="Upcoming"
          value={formatNumber(data.stats.upcoming)}
          icon={<TrendingUp />}
          href="/customer/bookings?status=CONFIRMED"
        />
        <StatCard
          label="Completed"
          value={formatNumber(data.stats.completed)}
          icon={<CheckCircle2 />}
          href="/customer/bookings?status=COMPLETED"
        />
        <StatCard
          label="Total spent"
          value={formatINR(data.stats.totalSpent, { compact: true })}
          icon={<IndianRupee />}
          href="/customer/payments"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent bookings</h2>
            <Button asChild variant="ghost" size="sm" icon={<ArrowRight />}>
              <Link href="/customer/bookings">View all</Link>
            </Button>
          </div>

          {data.recent.length === 0 ? (
            <EmptyState
              icon="book"
              title="No bookings yet"
              description="When you book a service it will appear here with live status updates."
              actionLabel="Book your first service"
              actionHref="/customer/book/new"
            />
          ) : (
            <div className="space-y-3">
              {data.recent.map((booking) => (
                <Card key={booking.id} className="hover:border-brand/40 transition-colors">
                  <CardContent className="flex flex-wrap items-center gap-4 p-4">
                    {booking.worker ? (
                      <AvatarCircle name={booking.worker.name} size="md" online={booking.worker.isOnline} />
                    ) : (
                      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                        <CalendarClock className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{booking.title}</p>
                      <p className="text-muted-foreground mt-0.5 text-[13px]">
                        {booking.worker?.name ?? "Finding a professional"} · {formatDate(booking.scheduledDate)} at{" "}
                        {booking.scheduledTime}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Booked {formatRelativeDay(booking.createdAt)} · {booking.paymentStatus.toLowerCase()}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                    <Button size="sm" variant="outline" onClick={() => router.push(`/customer/bookings/${booking.id}`)}>
                      View
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="pt-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Recommended for you</h2>
              <Button asChild variant="ghost" size="sm" icon={<ArrowRight />}>
                <Link href="/services">All services</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.recommended.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onBook={() => router.push(`/customer/book/new?service=${service.id}`)}
                />
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top rated near you</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.nearby.length === 0 ? (
                <p className="text-muted-foreground text-[13px]">No professionals available right now.</p>
              ) : (
                data.nearby.map((worker) => (
                  <Link
                    key={worker.id}
                    href={`/workers/${worker.id}`}
                    className="hover:bg-accent/60 -mx-2 flex items-center gap-3 rounded-lg p-2 transition"
                  >
                    <AvatarCircle name={worker.name} size="sm" online={worker.isOnline} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{worker.name}</p>
                      <p className="text-muted-foreground truncate text-[13px]">{worker.headline}</p>
                    </div>
                    <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-[13px]">
                      <Star className="text-warning size-3.5 fill-warning" />
                      {worker.rating.toFixed(1)}
                    </span>
                  </Link>
                ))
              )}
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/workers">Browse all workers</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Book a service", href: "/customer/book/new", icon: CalendarPlus },
                { label: "Message a worker", href: "/customer/chat", icon: CalendarClock },
                { label: "Review past jobs", href: "/customer/reviews", icon: Star },
                { label: "Payment history", href: "/customer/payments", icon: IndianRupee },
              ].map((action) => (
                <Button
                  key={action.href}
                  asChild
                  variant="ghost"
                  className="w-full justify-start"
                  icon={<action.icon />}
                >
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
