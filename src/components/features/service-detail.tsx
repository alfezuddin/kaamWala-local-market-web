"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingStars } from "@/components/ui/rating-stars";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { ServiceIconTile } from "@/components/ui/service-card";
import { ServiceCard } from "@/components/ui/service-card";
import { WorkerCard } from "@/components/ui/worker-card";
import { EmptyState, ErrorState, SectionLoader } from "@/components/ui/states";
import { useApiQuery } from "@/hooks/use-api";
import { getCategoryById, getRelatedServices, getServiceBySlug, getServicesByCategory, getWorkersForService } from "@/services/catalog";
import { formatINR, formatNumber, formatRelativeDay } from "@/lib/format";
import { getDb } from "@/mock/db";

const STEPS = [
  { title: "Pick a service", body: "Choose what you need and compare fixed visit charges with no hidden surprises." },
  { title: "Choose a professional", body: "Filter by rating, price and distance, then review verified work history." },
  { title: "Book a slot", body: "Select a date and time. Every booking has a clear status you can track." },
  { title: "Pay after service", body: "Release payment only once the job is marked complete. Full refund if cancelled." },
];

export function ServiceDetail({ slug }: { slug: string }) {
  const serviceQuery = useApiQuery(["service", slug], () => getServiceBySlug(slug));
  const service = serviceQuery.data ?? null;

  const categoryQuery = useApiQuery(
    ["service", slug, "category"],
    () => (service ? getCategoryById(service.categoryId) : Promise.resolve(null)),
    { enabled: Boolean(service) },
  );
  const workersQuery = useApiQuery(
    ["service", slug, "workers"],
    () => (service ? getWorkersForService(service.id) : Promise.resolve([])),
    { enabled: Boolean(service) },
  );
  const relatedQuery = useApiQuery(
    ["service", slug, "related"],
    () => (service ? getRelatedServices(service.id, 3) : Promise.resolve([])),
    { enabled: Boolean(service) },
  );
  const categoryServicesQuery = useApiQuery(
    ["service", slug, "category-services"],
    () => (service ? getServicesByCategory(service.categoryId) : Promise.resolve([])),
    { enabled: Boolean(service) },
  );

  const [selectedWorker, setSelectedWorker] = React.useState<string | null>(null);

  const db = getDb();
  const customerName = (id: string) => db.customers.find((c) => c.id === id)?.name ?? "KaamWala Customer";

  if (serviceQuery.isLoading) return <SectionLoader label="Loading service…" />;
  if (serviceQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState onRetry={() => serviceQuery.refetch()} />
      </div>
    );
  }
  if (!service) notFound();

  const workers = workersQuery.data ?? [];
  const category = categoryQuery.data;
  const allReviews = workers.flatMap((w) =>
    db.reviews
      .filter((r) => r.workerId === w.id && !r.isHidden)
      .map((r) => ({ ...r, worker: w, customerName: customerName(r.customerId) })),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4" icon={<ArrowLeft />}>
        <Link href={category ? `/services?category=${category.id}` : "/services"}>
          {category ? category.name : "All services"}
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <ServiceIconTile icon={category?.icon} className="size-16 shrink-0 text-2xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {category && (
                      <Link
                        href={`/services?category=${category.id}`}
                        className="bg-brand-soft text-brand-soft-foreground hover:opacity-90 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      >
                        {category.name}
                      </Link>
                    )}
                    <Badge variant="muted">Fixed visit charge</Badge>
                  </div>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{service.name}</h1>
                  <p className="text-muted-foreground mt-1.5 text-sm">{service.shortDescription}</p>
                  <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
                    <span className="flex items-center gap-1.5">
                      <RatingStars value={service.rating} size="xs" />
                      <span className="text-foreground font-medium">{service.rating.toFixed(1)}</span>
                      <Link href="#reviews" className="underline-offset-2 hover:underline">
                        ({formatNumber(service.reviewCount)} reviews)
                      </Link>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BadgeCheck className="size-4 text-brand" />
                      {formatNumber(service.workerCount)} verified workers
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4" />
                      Same-day slots available
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="workers">Workers ({workers.length})</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({allReviews.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-5 space-y-6">
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="font-semibold">About this service</h2>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{service.description}</p>
                  {service.includes?.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <h3 className="text-sm font-semibold">What is included</h3>
                      <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
                        {service.includes.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="font-semibold">How it works</h2>
                  <ol className="mt-4 grid gap-4 sm:grid-cols-2">
                    {STEPS.map((step, i) => (
                      <li key={step.title} className="flex gap-3">
                        <span className="bg-brand text-brand-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{step.title}</p>
                          <p className="text-muted-foreground mt-0.5 text-[13px] leading-relaxed">{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="font-semibold">Safety &amp; trust</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {[
                      { icon: ShieldCheck, title: "Background verified", body: "Aadhaar and address proof checked before a worker goes live." },
                      { icon: BadgeCheck, title: "Fixed pricing", body: "The price you confirm is the price you pay. No surge at the door." },
                      { icon: MessageCircle, title: "In-app support", body: "Chat, call and raise a complaint without leaving KaamWala." },
                    ].map((item) => (
                      <div key={item.title} className="bg-muted/40 rounded-lg p-3.5">
                        <item.icon className="text-brand size-5" />
                        <p className="mt-2 text-sm font-medium">{item.title}</p>
                        <p className="text-muted-foreground mt-0.5 text-[13px] leading-relaxed">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="mt-5">
              <Card>
                <CardHeader>
                  <CardTitle>Transparent pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Starting price", value: formatINR(service.startingPrice) },
                      { label: "Average visit charge", value: formatINR(Math.round(service.startingPrice * 0.6)) },
                      { label: "Booking fee", value: "Free" },
                    ].map((row) => (
                      <div key={row.label} className="bg-muted/40 rounded-lg p-4">
                        <p className="text-muted-foreground text-[13px]">{row.label}</p>
                        <p className="mt-1 text-xl font-bold">{row.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-[13px] leading-relaxed">
                    The final amount may vary with scope of work. You approve any change before it begins, and you only
                    release payment after the job is marked complete.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workers" className="mt-5">
              {workersQuery.isLoading ? (
                <SectionLoader label="Finding professionals…" />
              ) : workers.length === 0 ? (
                <EmptyState
                  title="No workers available yet"
                  description="Professionals for this service are being verified. Please check back shortly."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {workers.map((worker) => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      categoryName={category?.name}
                      onRequest={() => setSelectedWorker(worker.id)}
                      requestLabel={selectedWorker === worker.id ? "Selected" : "Select"}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-5" id="reviews">
              {allReviews.length === 0 ? (
                <EmptyState
                  icon="chat"
                  title="No reviews yet"
                  description="Be the first to review this service after your booking is completed."
                />
              ) : (
                <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                  <Card className="h-fit">
                    <CardContent className="p-5 text-center">
                      <p className="text-4xl font-bold">{service.rating.toFixed(1)}</p>
                      <div className="mt-1.5 flex justify-center">
                        <RatingStars value={service.rating} showValue={false} />
                      </div>
                      <p className="text-muted-foreground mt-1.5 text-[13px]">
                        {formatNumber(service.reviewCount)} customer reviews
                      </p>
                    </CardContent>
                  </Card>
                  <div className="space-y-3">
                    {allReviews.slice(0, 6).map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <AvatarCircle name={review.customerName ?? "KaamWala Customer"} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">
                                  {review.customerName ?? "KaamWala Customer"}
                                </p>
                                <RatingStars value={review.rating} showValue={false} size="xs" />
                                <span className="text-muted-foreground ml-auto text-xs">
                                  {formatRelativeDay(review.createdAt)}
                                </span>
                              </div>
                              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{review.comment}</p>
                              {review.worker && (
                                <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                                  <Star className="size-3" />
                                  Booked {review.worker.name}
                                </p>
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
          </Tabs>

          {(relatedQuery.data ?? []).length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">Related services</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(relatedQuery.data ?? []).map((related) => (
                  <ServiceCard key={related.id} service={related} categoryName={category?.name} href={`/services/${related.slug}`} />
                ))}
              </div>
            </section>
          )}

          {(categoryServicesQuery.data ?? []).filter((s) => s.id !== service.id).length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">More in {category?.name}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(categoryServicesQuery.data ?? [])
                  .filter((s) => s.id !== service.id)
                  .map((s) => (
                    <Button key={s.id} asChild variant="outline" size="sm">
                      <Link href={`/services/${s.slug}`}>{s.name}</Link>
                    </Button>
                  ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card>
            <CardContent className="p-5">
              <p className="text-muted-foreground text-[13px]">Starting from</p>
              <p className="mt-0.5 text-3xl font-bold">{formatINR(service.startingPrice)}</p>
              <p className="text-muted-foreground mt-1 text-[13px]">Includes visit charge. Pay after service.</p>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                {[
                  { icon: Clock, label: "Same-day availability" },
                  { icon: ShieldCheck, label: "Verified professionals only" },
                  { icon: BadgeCheck, label: "Free cancellation up to 2 hours before" },
                ].map((row) => (
                  <p key={row.label} className="text-muted-foreground flex items-center gap-2 text-[13px]">
                    <row.icon className="text-brand size-4 shrink-0" />
                    {row.label}
                  </p>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                <Button className="w-full" size="lg" asChild>
                  <Link href={`/customer/book/new?service=${service.id}`}>Book this service</Link>
                </Button>
                <Button variant="outline" className="w-full" size="lg" asChild>
                  <Link href="/workers">Compare workers</Link>
                </Button>
              </div>
              <Separator className="my-4" />
              <div className="text-muted-foreground flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  Serviceable in 30+ cities
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="size-4" />
                  Support
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
