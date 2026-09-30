"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ThumbsUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { getCustomerReviews, markReviewHelpful } from "@/services/reviews";
import { useDbVersion } from "@/hooks/use-mounted";
import { formatDate, formatTimeAgo } from "@/lib/format";
import { getDb } from "@/mock/db";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "5", label: "5 star" },
  { value: "4", label: "4 star" },
  { value: "3", label: "3 star" },
  { value: "LOW", label: "Needs attention" },
];

export function CustomerReviewsPage() {
  const toast = useToast();
  const { session } = useAuth();
  const userId = session?.userId;
  const dbVersion = useDbVersion();
  const [filter, setFilter] = React.useState("ALL");

  const query = useApiQuery(
    ["reviews", "customer", userId, dbVersion],
    () => (userId ? getCustomerReviews(userId) : Promise.resolve({ submitted: [], pending: [] })),
    { enabled: Boolean(userId) },
  );
  const helpful = useApiMutation((vars: { id: string }) => markReviewHelpful(vars.id), {
    onSuccess: () => {
      toast.success("Thanks!", "Your vote helps other customers.");
    },
    onError: (error) => toast.error("Could not register vote", error.message),
  });

  const db = getDb();
  const submitted = query.data?.submitted ?? [];
  const pendingJobs = query.data?.pending ?? [];
  const avg = submitted.length ? submitted.reduce((s, r) => s + r.rating, 0) / submitted.length : 0;

  const filtered = submitted.filter((r) => {
    if (filter === "ALL") return true;
    if (filter === "LOW") return r.rating <= 3;
    return String(r.rating) === filter;
  });

  if (query.isLoading) return <SectionLoader label="Loading your reviews…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My reviews"
        description="Feedback you have shared with other KaamWala customers."
        breadcrumbs={[{ label: "Customer", href: "/customer/dashboard" }, { label: "Reviews" }]}
        actions={
          <Button asChild variant="outline">
            <Link href="/customer/bookings?status=COMPLETED">Rate a completed job</Link>
          </Button>
        }
      />

      {pendingJobs.length > 0 && (
        <Card className="border-brand/30 bg-brand-soft/40">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Star className="text-brand size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {pendingJobs.length} completed job{pendingJobs.length === 1 ? "" : "s"} awaiting your review
              </p>
              <p className="text-muted-foreground text-[13px]">Your feedback helps professionals get better jobs.</p>
            </div>
            <Button size="sm" asChild>
              <Link href={`/customer/bookings/${pendingJobs[0].id}`}>Review now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {submitted.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-4xl font-bold">{avg.toFixed(1)}</p>
              <div className="mt-1.5 flex justify-center">
                <RatingStars value={avg} showValue={false} />
              </div>
              <p className="text-muted-foreground mt-1.5 text-[13px]">Average you gave</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-4xl font-bold">{submitted.length}</p>
              <p className="text-muted-foreground mt-1.5 text-[13px]">Reviews written</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <p className="text-4xl font-bold">{submitted.filter((r) => r.rating >= 4).length}</p>
              <p className="text-muted-foreground mt-1.5 text-[13px]">4★ and above</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[13px] transition",
              filter === f.value ? "border-brand bg-brand text-brand-foreground" : "border-border hover:border-brand/40",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="chat"
          title={submitted.length === 0 ? "No reviews yet" : "No reviews match this filter"}
          description={
            submitted.length === 0
              ? "Once a booking is completed you can rate the service and share your experience."
              : "Try a different rating filter."
          }
          actionLabel={submitted.length === 0 ? "View completed jobs" : undefined}
          actionHref={submitted.length === 0 ? "/customer/bookings?status=COMPLETED" : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => {
            const worker = db.workers.find((w) => w.id === review.workerId);
            const service = db.services.find((s) => s.id === review.serviceId);
            return (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {worker && <AvatarCircle name={worker.name} size="sm" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{worker?.name ?? "Professional"}</p>
                        <RatingStars value={review.rating} showValue={false} size="xs" />
                        <span className="text-muted-foreground ml-auto text-xs">{formatDate(review.createdAt)}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {service?.name ?? "Service"} · {formatTimeAgo(review.createdAt)}
                      </p>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{review.comment}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={<ThumbsUp />}
                          onClick={() => helpful.mutate({ id: review.id })}
                          loading={helpful.isPending}
                        >
                          Helpful ({review.helpfulCount})
                        </Button>
                        {review.isHidden && <Badge variant="warning">Hidden by KaamWala</Badge>}
                        {worker && (
                          <Button asChild variant="ghost" size="xs">
                            <Link href={`/workers/${worker.id}`}>View profile</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
