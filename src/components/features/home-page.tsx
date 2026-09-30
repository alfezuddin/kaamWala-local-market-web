"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Search, ShieldCheck, Sparkles, Star, Users, Wallet, BadgeCheck, Quote, CalendarDays, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { ServiceCard } from "@/components/ui/service-card";
import { ServiceVisual } from "@/components/ui/avatar-circle";
import { RatingStars } from "@/components/ui/rating-stars";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { useApiQuery } from "@/hooks/use-api";
import { getCategories, getPopularServices } from "@/services/catalog";
import { CITIES, AREAS } from "@/lib/constants";
import { formatNumber, formatINR } from "@/lib/format";
import { TESTIMONIALS } from "@/mock/seed";

const HOW_IT_WORKS = [
  { step: "01", title: "Choose a Service", description: "Pick from 40+ services or tell us what you need in plain language.", icon: Sparkles },
  { step: "02", title: "Find a Worker", description: "Compare verified professionals by rating, price and distance near you.", icon: Users },
  { step: "03", title: "Book a Service", description: "Choose a convenient date and time. Pay only after the work is done.", icon: CalendarDays },
  { step: "04", title: "Get the Work Done", description: "Track the job live, then rate the worker to help your neighbourhood.", icon: BadgeCheck },
];

const TRUST_ITEMS = [
  { icon: BadgeCheck, title: "verified workers", description: "Every professional passes ID, address and skill verification before going live." },
  { icon: Wallet, title: "Secure Payments", description: "Pay by UPI, card, wallet or cash. Money is released only after the job is completed." },
  { icon: Star, title: "Transparent Pricing", description: "Know the visit charge and hourly rate upfront. No hidden costs, ever." },
  { icon: Users, title: "Customer Reviews", description: "Ratings come only from customers who actually completed a booking with the worker." },
  { icon: ShieldCheck, title: "24x7 Support", description: "Our support team helps with rescheduling, refunds and disputes any time of the day." },
  { icon: Zap, title: "Same-day Service", description: "Emergency availability from verified electricians, plumbers and AC technicians." },
];

export function HomePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = React.useState(params.get("q") ?? "");
  const [city, setCity] = React.useState(params.get("city") ?? "Indore");

  const categoriesQuery = useApiQuery(["home", "categories"], () => getCategories(), { staleTime: 5 * 60_000 });
  const servicesQuery = useApiQuery(["home", "popular-services"], () => getPopularServices(8), { staleTime: 5 * 60_000 });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (term.trim()) q.set("q", term.trim());
    if (city) q.set("city", city);
    router.push(`/workers?${q.toString()}`);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-soft/60 via-background to-background">
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20 lg:px-8">
          <div>
            <Badge variant="brand" size="lg" className="mb-5">
              <ShieldCheck className="size-3.5" />
              Trusted by 25,000+ families across 8 cities
            </Badge>
            <h1 className="text-balance text-3xl leading-[1.15] font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Har Kaam Ke Liye, Sahi Worker <span className="text-primary">Yahin Milega.</span>
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-base leading-relaxed">
              Find verified local professionals for every household need — plumbing, electrical, cleaning, repairs and
              more. Transparent pricing, secure payments, and support until the job is done.
            </p>

            <form onSubmit={submit} className="mt-8 max-w-2xl">
              <div className="bg-card rounded-xl border border-border p-2 shadow-card">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder="Search plumber, electrician, carpenter…"
                      aria-label="Search for a service"
                      className="h-12 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <div className="hidden w-px bg-border sm:block" />
                  <div className="relative sm:w-44">
                    <MapPin className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      aria-label="Select city"
                      className="h-12 w-full appearance-none rounded-lg bg-transparent pr-8 pl-9 text-sm focus:ring-0 focus:outline-none"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" size="lg" className="h-12">
                    Search
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
                <span className="text-muted-foreground">Popular:</span>
                {["Plumber", "Electrician", "AC Service", "Deep Cleaning", "Pest Control"].map((p) => (
                  <Link
                    key={p}
                    href={`/workers?q=${encodeURIComponent(p)}`}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full border border-border px-2.5 py-1 transition"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </form>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/workers">Find a Worker</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/worker/register">Become a Worker</Link>
              </Button>
            </div>
          </div>

          <HeroArtwork />
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { value: "25,000+", label: "Happy customers" },
            { value: "8,400+", label: "verified workers" },
            { value: "40+", label: "Service categories" },
            { value: "4.7/5", label: "Average rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">{stat.value}</p>
              <p className="text-muted-foreground mt-1 text-[13px]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Service categories"
          title="Every kind of work, one trusted platform"
          description="Browse 16 categories and 48 subcategories covering everything your home and office need."
          actionLabel="View all services"
          actionHref="/services"
        />
        {categoriesQuery.isError ? (
          <ErrorState onRetry={() => categoriesQuery.refetch()} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoriesQuery.isLoading
              ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
              : (categoriesQuery.data ?? []).map((category) => (
                  <Link
                    key={category.id}
                    href={`/services?category=${category.id}`}
                    className="group bg-card focus-visible:ring-ring rounded-xl border border-border p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="bg-brand-soft text-brand-soft-foreground group-hover:bg-primary group-hover:text-primary-foreground flex size-11 items-center justify-center rounded-lg transition-colors">
                      <DynamicIcon name={category.icon} className="size-5" />
                    </span>
                    <h3 className="mt-4 font-semibold">{category.name}</h3>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-[13px]">{category.description}</p>
                    <p className="text-muted-foreground mt-3 text-xs">
                      {formatNumber(6 + category.subcategories.length * 3)} workers · {category.subcategories.length}
                      subcategories
                    </p>
                  </Link>
                ))}
          </div>
        )}
      </section>

      {/* Popular services */}
      <section className="bg-muted/40 border-y border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Popular services"
            title="Book the most searched services this month"
            description="Fixed visit charges and upfront estimates so you always know what you are paying."
            actionLabel="See all services"
            actionHref="/services"
          />
          {servicesQuery.isError ? (
            <ErrorState onRetry={() => servicesQuery.refetch()} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {servicesQuery.isLoading
                ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                : (servicesQuery.data ?? []).slice(0, 8).map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onBook={() => router.push(`/customer/book/new?service=${service.id}`)}
                    />
                  ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Book a trusted professional in four simple steps"
          description="From search to completion, everything happens inside one app."
        />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <li key={item.step} className="relative">
              <Card className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="bg-brand-soft text-brand-soft-foreground flex size-11 items-center justify-center rounded-lg">
                      <item.icon className="size-5" />
                    </span>
                    <span className="text-muted-foreground text-3xl font-bold tabular-nums">{item.step}</span>
                  </div>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/services">Get started</Link>
          </Button>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why KaamWala"
            title="Built on trust, transparency and safety"
            description="We verify every worker and protect every payment until the job is done."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-xl border border-border bg-background p-5">
                <span className="bg-brand-soft text-brand-soft-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Customer stories"
          title="What people in your neighbourhood say"
          description="Over 180,000 verified reviews from customers across India."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.id} className="flex h-full flex-col">
              <CardContent className="flex h-full flex-col p-5">
                <Quote className="text-brand/25 size-8" aria-hidden />
                <p className="mt-2 flex-1 text-[15px] leading-relaxed">{t.quote}</p>
                <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <AvatarCircle name={t.name} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t.name}</p>
                    <p className="text-muted-foreground truncate text-[13px]">{t.location}</p>
                  </div>
                  <RatingStars value={t.rating} showValue={false} className="ml-auto" />
                </div>
                <Badge variant="muted" size="sm" className="mt-3 w-fit">
                  {t.service}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-b from-brand-soft/50 to-background">
        <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">Need a worker today?</h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-base">
            Verified professionals are available in your area today. Book in under a minute and pay only after the work
            is done.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/workers">
                Find a Worker <Search />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/worker/register">Become a Worker</Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-5 text-[13px]">
            Average visit charge starts at {formatINR(299)} · Same-day availability in 8 cities
          </p>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-primary text-[13px] font-semibold tracking-widest uppercase">{eyebrow}</p>
        <h2 className="text-balance mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {description && <p className="text-muted-foreground mt-2 text-[15px]">{description}</p>}
      </div>
      {actionLabel && actionHref && (
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}

function HeroArtwork() {
  const city = "Indore";
  return (
    <div className="relative" aria-hidden>
      <div className="bg-card relative overflow-hidden rounded-2xl border border-border p-6 shadow-card">
        <div className="bg-brand-soft/50 absolute -top-16 -right-10 size-52 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[13px]">Available now near you</p>
              <p className="text-lg font-semibold">{city}</p>
            </div>
            <Badge variant="success">
              <span className="bg-success size-1.5 rounded-full" />
              142 workers online
            </Badge>
          </div>

          <div className="mt-5 space-y-3">
            {[
              { name: "Rajesh Kumar", job: "Plumber", rating: 4.8, price: 350, tone: "bg-gradient-to-br from-indigo-500 to-blue-600" },
              { name: "Sunita Patel", job: "Maid", rating: 4.7, price: 500, tone: "bg-gradient-to-br from-fuchsia-500 to-violet-600" },
              { name: "Amit Verma", job: "Electrician", rating: 4.9, price: 349, tone: "bg-gradient-to-br from-amber-500 to-orange-600" },
            ].map((w) => (
              <div key={w.name} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                <span className={`flex size-11 items-center justify-center rounded-full ${w.tone}`}>
                  <AvatarCircle name={w.name} size="sm" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{w.name}</p>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-[13px]">
                    <span>{w.job}</span>
                    <span>·</span>
                    <RatingStars value={w.rating} showValue size="xs" />
                  </div>
                </div>
                <span className="text-sm font-bold">{formatINR(w.price)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Plumber", "Electrician", "Cleaner"].map((c) => (
              <div key={c} className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3">
                <ServiceVisual icon={c === "Plumber" ? "Wrench" : c === "Electrician" ? "Zap" : "SprayCan"} name={c} className="h-10 w-full rounded-md p-0" />
                <span className="text-[11px] font-medium">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card absolute -bottom-5 -left-4 hidden items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 shadow-card sm:flex">
        <span className="bg-success/12 text-success flex size-8 items-center justify-center rounded-lg">
          <ShieldCheck className="size-4" />
        </span>
        <div>
          <p className="text-[13px] font-semibold">Payment protected</p>
          <p className="text-muted-foreground text-[11px]">Released after completion</p>
        </div>
      </div>
    </div>
  );
}

export function AreaPicker({
  city,
  area,
  onAreaChange,
}: {
  city: string;
  area: string;
  onAreaChange: (value: string) => void;
}) {
  const areas = AREAS[city] ?? [];
  return (
    <select
      value={area}
      onChange={(e) => onAreaChange(e.target.value)}
      aria-label="Select area"
      className="border-input bg-card h-10 w-full rounded-lg border px-3 text-sm shadow-soft focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none"
    >
      <option value="">All areas</option>
      {areas.map((a) => (
        <option key={a} value={a}>
          {a}
        </option>
      ))}
    </select>
  );
}
