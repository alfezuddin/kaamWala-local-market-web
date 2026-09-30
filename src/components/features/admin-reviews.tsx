"use client";

import * as React from "react";
import Link from "next/link";
import { Download, EyeOff, Eye, Search, Star, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RatingStars } from "@/components/ui/rating-stars";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { getReviews, setReviewVisibility } from "@/services/reviews";
import { exportRowsToCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import type { Review } from "@/types";

type Row = Review & {
  customer: { id: string; name: string } | null;
  worker: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
};

export function AdminReviewsPage() {
  const toast = useToast();
  const dbVersion = useDbVersion();
  const [search, setSearch] = React.useState("");
  const [minRating, setMinRating] = React.useState("0");

  const query = useApiQuery(
    ["admin", "reviews", search, minRating, dbVersion],
    () => getReviews({ includeHidden: true, search: search.trim() || undefined, minRating: Number(minRating) }),
  );

  const visibility = useApiMutation(
    (vars: { id: string; hidden: boolean }) => setReviewVisibility(vars.id, vars.hidden),
    {
      onSuccess: (_, vars) => {
        toast.success(vars.hidden ? "Review hidden" : "Review published", "The change is live immediately.");
        query.refetch();
      },
      onError: (error) => toast.error("Could not update review", error.message),
    },
  );

  const rows = (query.data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Moderate customer feedback and keep the marketplace trustworthy."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Reviews" }]}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              if (rows.length === 0) {
                toast.warning("Nothing to export", "No reviews match your filters.");
                return;
              }
              exportRowsToCsv(
                "reviews.csv",
                rows.map((r) => ({
                  id: r.id,
                  rating: r.rating,
                  customer: r.customer?.name ?? "",
                  worker: r.worker?.name ?? "",
                  service: r.service?.name ?? "",
                  hidden: r.isHidden,
                  createdAt: r.createdAt,
                  comment: r.comment,
                })),
              );
              toast.success("Export ready", `${rows.length} reviews downloaded.`);
            }}
            icon={<Download />}
          >
            Export CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search review text, customer, professional…"
            icon={<Search />}
            aria-label="Search reviews"
          />
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger aria-label="Filter by rating">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All ratings</SelectItem>
              <SelectItem value="1">1 star only</SelectItem>
              <SelectItem value="2">2 stars &amp; up</SelectItem>
              <SelectItem value="3">3 stars &amp; up</SelectItem>
              <SelectItem value="4">4 stars &amp; up</SelectItem>
              <SelectItem value="5">5 stars only</SelectItem>
            </SelectContent>
          </Select>
          {(search || minRating !== "0") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setMinRating("0");
              }}
              icon={<X />}
            >
              Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {query.isLoading ? (
        <SectionLoader label="Loading reviews…" />
      ) : rows.length === 0 ? (
        <EmptyState icon="search" title="No reviews found" description="Try a different search or rating filter." />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <RatingStars value={r.rating} size="sm" />
                      <span className="text-sm font-medium">{r.customer?.name ?? "Deleted customer"}</span>
                      <span className="text-muted-foreground text-[13px]">
                        reviewed {r.worker?.name ?? "a professional"}
                      </span>
                      {r.isHidden && <Badge variant="destructive">Hidden</Badge>}
                      {r.reply && <Badge variant="info">Replied</Badge>}
                    </div>
                    <p className="text-[15px] leading-relaxed">{r.comment}</p>
                    <p className="text-muted-foreground text-[13px]">
                      {r.service?.name ?? "Service"} · {formatDate(r.createdAt)} · {r.helpfulCount} found this helpful
                    </p>
                    {r.reply && (
                      <p className="border-border bg-muted/40 rounded-lg border p-2.5 text-[13px]">
                        <span className="font-medium">Professional reply:</span> {r.reply}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant={r.isHidden ? "secondary" : "outline"}
                      onClick={() => visibility.mutate({ id: r.id, hidden: !r.isHidden })}
                      icon={r.isHidden ? <Eye /> : <EyeOff />}
                    >
                      {r.isHidden ? "Publish" : "Hide"}
                    </Button>
                    {r.worker && (
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/workers?q=${encodeURIComponent(r.worker.name)}`}>
                          <Star />
                          Professional
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Moderation policy</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-1.5 text-[13px]">
          <p>
            Hide reviews that contain personal contact details, abuse, or content unrelated to the service. Hidden
            reviews stay in this console and are excluded from all public rating averages.
          </p>
          <p>All moderation actions are timestamped and reversible.</p>
        </CardContent>
      </Card>
    </div>
  );
}
