"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Languages,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingStars } from "@/components/ui/rating-stars";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { VerifiedBadge, StatusBadge } from "@/components/ui/status-badge";
import { WorkerCard } from "@/components/ui/worker-card";
import { EmptyState, ErrorState, SectionLoader } from "@/components/ui/states";
import { ServiceCard } from "@/components/ui/service-card";
import { useApiQuery } from "@/hooks/use-api";
import { getCategoryById, getServices } from "@/services/catalog";
import { getSimilarWorkers, getWorkerById, getWorkerReviews } from "@/services/workers";
import { getBookings } from "@/services/bookings";
import { formatDate, formatINR, formatNumber, formatRelativeDay, initials } from "@/lib/format";
import { getDb } from "@/mock/db";
import type { Booking } from "@/types";

const WEEK: { day: number; label: string }[] = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 0, label: "Sun" },
];

export function WorkerDetail({ id }: { id: string }) {
  const detailQuery = useApiQuery(["worker", id], () => getWorkerById(id));
  const reviewsQuery = useApiQuery(["worker", id, "reviews"], () => getWorkerReviews(id));
  const similarQuery = useApiQuery(["worker", id, "similar"], () => getSimilarWorkers(id, 4));
  const categoryQuery = useApiQuery(
    ["worker", id, "category"],
    () => (detailQuery.data?.worker ? getCategoryById(detailQuery.data.worker.categoryId) : Promise.resolve(null)),
    { enabled: Boolean(detailQuery.data?.worker) },
  );
  const servicesQuery = useApiQuery(["services", "all"], () => getServices());
  const bookingsQuery = useApiQuery(
    ["worker", id, "bookings"],
    () => (detailQuery.data?.worker ? getBookings({ workerId: detailQuery.data.worker.id }) : Promise.resolve<Booking[]>([])),
    { enabled: Boolean(detailQuery.data?.worker) },
  );

  if (detailQuery.isLoading) return <SectionLoader label="Loading profile…" />;
  if (detailQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState onRetry={() => detailQuery.refetch()} />
      </div>
    );
  }
  const worker = detailQuery.data?.worker;
  if (!worker) notFound();

  const db = getDb();
  const category = categoryQuery.data;
  const reviews = reviewsQuery.data?.reviews ?? [];
  const breakdown = reviewsQuery.data?.breakdown ?? worker.ratingBreakdown;
  const workerServices = (servicesQuery.data ?? []).filter((s) => worker.serviceIds.includes(s.id));
  const allBookings: Booking[] = bookingsQuery.data ?? [];
  const recentBookings = allBookings.slice(0, 4);
  const totalReviews = Object.values(breakdown).reduce((a, b) => a + b, 0) || worker.reviewCount;
  const lastJobs = allBookings.filter((b) => b.status === "COMPLETED").slice(0, 3);
  const customerName = (cid: string) => db.customers.find((c) => c.id === cid)?.name ?? "Customer";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4" icon={<ArrowLeft />}>
        <Link href="/workers">All workers</Link>
      </Button>

      <Card className="overflow-hidden">
        <div className="from-brand/12 via-brand/5 h-32 bg-gradient-to-r to-transparent" />
        <CardContent className="-mt-12 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="bg-card rounded-full">
              <AvatarCircle name={worker.name} size="xl" online={worker.isOnline} className="ring-background border-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{worker.name}</h1>
                <VerifiedBadge />
                {worker.isOnline && <Badge variant="success">Online now</Badge>}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{worker.headline}</p>
              <div className="text-muted-foreground mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
                <span className="flex items-center gap-1.5">
                  <RatingStars value={worker.rating} size="xs" />
                  <span className="text-foreground font-medium">{worker.rating.toFixed(1)}</span>
                  <span>({formatNumber(worker.reviewCount)} reviews)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="size-4" />
                  {formatNumber(worker.completedJobs)} jobs done
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" />
                  {worker.experienceYears} yrs experience
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {worker.area}, {worker.city}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" asChild>
                <Link href="/workers">Find similar</Link>
              </Button>
              <Button asChild>
                <Link href={`/customer/book/new?worker=${worker.id}`}>Book now</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Tabs defaultValue="about">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="services">Services ({workerServices.length})</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({totalReviews})</TabsTrigger>
              <TabsTrigger value="jobs">Recent jobs</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-5 space-y-6">
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="font-semibold">About {worker.name.split(" ")[0]}</h2>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{worker.about}</p>
                  {worker.skills.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <h3 className="text-sm font-semibold">Skills</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {worker.skills.map((skill) => (
                          <Badge key={skill} variant="muted">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="font-semibold">Availability</h2>
                  <div className="mt-3 space-y-2">
                    {WEEK.map(({ day, label }) => {
                      const slot = worker.availability.find((a) => a.day === day);
                      const on = Boolean(slot?.enabled);
                      return (
                        <div key={day} className="flex items-center gap-3 text-sm">
                          <span className="w-10 shrink-0 font-medium">{label}</span>
                          <span className="bg-border h-4 w-px" />
                          <span className={on ? "" : "text-muted-foreground"}>
                            {on ? `${slot!.start} – ${slot!.end}` : "Not available"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {worker.emergencyAvailable && (
                    <p className="bg-success/10 text-success mt-4 flex items-center gap-2 rounded-lg p-3 text-[13px]">
                      <CheckCircle2 className="size-4 shrink-0" />
                      Available for urgent same-day visits
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="font-semibold">Verification &amp; trust</h2>
                  <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {[
                      { ok: worker.verification === "APPROVED", label: "Identity verified (Aadhaar)" },
                      { ok: worker.documents.some((d) => d.type === "PAN" && d.status === "APPROVED"), label: "PAN submitted" },
                      {
                        ok: worker.documents.some((d) => d.type === "ADDRESS_PROOF" && d.status === "APPROVED"),
                        label: "Address proof verified",
                      },
                      { ok: worker.cancelledJobs / Math.max(1, worker.completedJobs) < 0.05, label: "Excellent cancellation record" },
                    ].map((item) => (
                      <li key={item.label} className="flex items-center gap-2 text-sm">
                        {item.ok ? (
                          <ShieldCheck className="text-success size-4 shrink-0" />
                        ) : (
                          <Clock className="text-muted-foreground size-4 shrink-0" />
                        )}
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="mt-5">
              {workerServices.length === 0 ? (
                <EmptyState
                  title="No services listed yet"
                  description="This professional has not added specific services to their profile."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {workerServices.map((s) => (
                    <ServiceCard key={s.id} service={s} categoryName={category?.name} href={`/services/${s.slug}`} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-5" id="reviews">
              {reviews.length === 0 ? (
                <EmptyState icon="chat" title="No reviews yet" description="Completed jobs will appear here with customer feedback." />
              ) : (
                <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                  <Card className="h-fit">
                    <CardContent className="p-5">
                      <p className="text-center text-4xl font-bold">{worker.rating.toFixed(1)}</p>
                      <div className="mt-1.5 flex justify-center">
                        <RatingStars value={worker.rating} showValue={false} />
                      </div>
                      <p className="text-muted-foreground mt-1.5 text-center text-[13px]">
                        {formatNumber(worker.reviewCount)} reviews
                      </p>
                      <Separator className="my-4" />
                      <div className="space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = breakdown[star as keyof typeof breakdown] ?? 0;
                          const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="w-6 shrink-0">{star}★</span>
                              <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                                <div className="bg-brand h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-muted-foreground w-8 shrink-0 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                  <div className="space-y-3">
                    {reviews.slice(0, 8).map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <AvatarCircle name={customerName(review.customerId)} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">{customerName(review.customerId)}</p>
                                <RatingStars value={review.rating} showValue={false} size="xs" />
                                <span className="text-muted-foreground ml-auto text-xs">
                                  {formatRelativeDay(review.createdAt)}
                                </span>
                              </div>
                              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{review.comment}</p>
                              {review.reply && (
                                <div className="bg-muted/50 mt-3 rounded-lg p-3">
                                  <p className="text-[13px] font-medium">{initials(worker.name)} replied</p>
                                  <p className="text-muted-foreground mt-1 text-[13px]">{review.reply}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="mt-5">
              {lastJobs.length === 0 ? (
                <EmptyState title="No completed jobs yet" description="Completed work will be listed here." />
              ) : (
                <div className="space-y-3">
                  {lastJobs.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="flex flex-wrap items-center gap-3 p-4">
                        <AvatarCircle name={customerName(booking.customerId)} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{booking.title}</p>
                          <p className="text-muted-foreground text-[13px]">
                            {booking.address.area}, {booking.address.city} · {formatDate(booking.scheduledDate)}
                          </p>
                        </div>
                        <Badge variant="muted">{formatINR(booking.price + booking.visitCharge + booking.platformFee)}</Badge>
                        {booking.rating && (
                          <span className="flex items-center gap-1 text-[13px]">
                            <Star className="text-warning size-3.5 fill-warning" />
                            {booking.rating}
                          </span>
                        )}
                        <StatusBadge status={booking.status} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { label: "Visit charge", value: worker.pricing.visitCharge },
                { label: "Starting price", value: worker.pricing.startingPrice },
                { label: "Hourly rate", value: worker.pricing.hourlyPrice },
                { label: "Minimum job", value: worker.pricing.minJobAmount },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium">{formatINR(row.value)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <Button className="w-full" asChild>
                <Link href={`/customer/book/new?worker=${worker.id}`}>Book this worker</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/customer/chat?worker=${worker.id}`}>
                  <MessageCircle className="size-4" /> Ask a question
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <BadgeCheck className="text-brand mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">{category?.name ?? "Professional"}</p>
                  <p className="text-muted-foreground text-[13px]">{worker.subcategoryIds.length} subcategories</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="text-brand mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">{worker.area}, {worker.city}</p>
                  <p className="text-muted-foreground text-[13px]">Serves {worker.areas.slice(0, 3).join(", ")}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Languages className="text-brand mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">{worker.languages.join(", ")}</p>
                  <p className="text-muted-foreground text-[13px]">Joined {formatDate(worker.joinedAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Wrench className="text-brand mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">{worker.experienceYears} years experience</p>
                  <p className="text-muted-foreground text-[13px]">
                    Last active {formatRelativeDay(worker.lastActiveAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {recentBookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Next availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {recentBookings
                  .filter((b) => b.status !== "COMPLETED" && b.status !== "CANCELLED")
                  .slice(0, 3)
                  .map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground truncate">{formatDate(b.scheduledDate)}</span>
                      <Badge variant="muted">{b.scheduledTime}</Badge>
                    </div>
                  ))}
                {recentBookings.filter((b) => b.status !== "COMPLETED" && b.status !== "CANCELLED").length === 0 && (
                  <p className="text-muted-foreground text-[13px]">
                    No upcoming slots. Same-day visits are usually possible — book and confirm in the app.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {(similarQuery.data ?? []).length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Similar professionals</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(similarQuery.data ?? []).map((w) => (
              <WorkerCard key={w.id} worker={w} categoryName={category?.name} showActions={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
