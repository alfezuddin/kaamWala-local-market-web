"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, MessageCircle, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { RatingStars } from "@/components/ui/rating-stars";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiQuery } from "@/hooks/use-api";
import { getWorkerReviews } from "@/services/workers";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function WorkerReviewsPage() {
  const { session } = useAuth();
  const userId = session?.userId;
  const [filter, setFilter] = React.useState<0 | 1 | 2 | 3 | 4 | 5 | "ALL">("ALL");

  const query = useApiQuery(
    ["worker", "reviews", userId],
    () => (userId ? getWorkerReviews(userId) : Promise.resolve(null)),
    { enabled: Boolean(userId) },
  );

  if (query.isLoading) return <SectionLoader label="Loading your reviews…" />;
  if (!query.data) {
    return (
      <EmptyState
        icon="inbox"
        title="No reviews yet"
        description="Reviews appear here after customers rate your completed jobs."
        actionLabel="View completed jobs"
        actionHref="/worker/jobs?status=COMPLETED"
      />
    );
  }

  const { reviews, breakdown, worker } = query.data;
  const total = reviews.length;
  const filtered = filter === "ALL" ? reviews : reviews.filter((r) => Math.floor(r.rating) === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My reviews"
        description="See what customers say and reply to the ones that need it."
        breadcrumbs={[{ label: "Professional", href: "/worker/dashboard" }, { label: "Reviews" }]}
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold tabular-nums">{(worker?.rating ?? 0).toFixed(1)}</p>
              <div className="mt-1 flex justify-center">
                <RatingStars value={worker?.rating ?? 0} size="lg" />
              </div>
              <p className="text-muted-foreground mt-1 text-[13px]">
                {total} review{total === 1 ? "" : "s"} · {worker?.completedJobs ?? 0} jobs completed
              </p>
            </div>

            <div className="space-y-1.5">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = breakdown[star] ?? 0;
                const pct = total === 0 ? 0 : Math.round((count / total) * 100);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFilter(filter === star ? "ALL" : star)}
                    aria-pressed={filter === star}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left transition",
                      filter === star ? "bg-brand-soft" : "hover:bg-accent/60",
                    )}
                  >
                    <span className="text-muted-foreground flex w-8 shrink-0 items-center gap-0.5 text-[13px]">
                      {star}
                      <Star className="size-3 fill-current" />
                    </span>
                    <span className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                      <span className="bg-brand block h-full rounded-full" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="text-muted-foreground w-8 shrink-0 text-right text-[13px] tabular-nums">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {filter !== "ALL" && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setFilter("ALL")}>
                Show all ratings
              </Button>
            )}

            <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
              <BarChart3 className="mt-0.5 size-3.5 shrink-0" />
              Ratings are based on completed jobs only. KaamWala removes reviews for cancelled work.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon="inbox"
              title={filter === "ALL" ? "No reviews yet" : `No ${filter}-star reviews`}
              description={
                filter === "ALL"
                  ? "Complete jobs and ask satisfied customers to rate you."
                  : "Try another rating filter."
              }
              actionLabel={filter === "ALL" ? "View completed jobs" : "Show all ratings"}
              actionHref={filter === "ALL" ? "/worker/jobs?status=COMPLETED" : undefined}
              onAction={filter === "ALL" ? undefined : () => setFilter("ALL")}
            />
          ) : (
            filtered.map((review) => (
              <Card key={review.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AvatarCircle name={review.customer?.name ?? "Customer"} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{review.customer?.name ?? "Verified customer"}</p>
                        <RatingStars value={review.rating} size="sm" />
                        {review.service && <Badge variant="outline">{review.service.name}</Badge>}
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-[13px]">{formatTimeAgo(review.createdAt)}</p>
                    </div>
                    {review.isVerifiedPurchase && (
                      <Badge variant="success" size="sm">
                        Verified job
                      </Badge>
                    )}
                  </div>
                  {review.comment && <p className="text-sm leading-relaxed">{review.comment}</p>}
                  {review.reply && (
                    <div className="bg-muted/60 rounded-lg p-3">
                      <p className="text-muted-foreground text-xs font-medium uppercase">Your reply</p>
                      <p className="mt-1 text-sm">{review.reply}</p>
                    </div>
                  )}
                  {!review.reply && review.rating <= 3 && (
                    <Button asChild variant="outline" size="sm" icon={<MessageCircle />}>
                      <Link href={`/worker/chat?booking=${review.bookingId}`}>Respond to the customer</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
