"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, Briefcase, Clock, MapPin, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { RatingStars } from "@/components/ui/rating-stars";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/ui/status-badge";
import { formatINR } from "@/lib/format";
import type { Worker } from "@/types";
import { cn } from "@/lib/utils";

export function WorkerCard({
  worker,
  categoryName,
  distance,
  onRequest,
  requestLabel = "Request Service",
  showActions = true,
  className,
}: {
  worker: Worker;
  categoryName?: string;
  distance?: number;
  onRequest?: () => void;
  requestLabel?: string;
  showActions?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("group h-full overflow-hidden transition-shadow hover:shadow-card", className)}>
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start gap-3.5">
          <AvatarCircle name={worker.name} size="lg" online={worker.isOnline} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={`/workers/${worker.id}`}
                className="focus-visible:ring-ring truncate font-semibold hover:text-primary hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                {worker.name}
              </Link>
              {worker.verification === "APPROVED" && <VerifiedBadge size="sm" />}
            </div>
            <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[13px]">{worker.headline}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
              <RatingStars value={worker.rating} size="xs" count={worker.reviewCount} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {categoryName && <Badge variant="brand" size="sm">{categoryName}</Badge>}
          {worker.skills.slice(0, 2).map((skill) => (
            <Badge key={skill} variant="muted" size="sm">
              {skill}
            </Badge>
          ))}
          {worker.emergencyAvailable && (
            <Badge variant="warning" size="sm">
              <ShieldCheck /> Emergency
            </Badge>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="size-3.5 shrink-0" />
            <dd>
              {worker.experienceYears} yr exp · {worker.completedJobs} jobs
            </dd>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <dd>{distance !== undefined ? `${distance.toFixed(1)} km · ${worker.area}` : worker.area}</dd>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5 shrink-0" />
            <dd>{worker.areas.slice(0, 3).join(", ")}</dd>
          </div>
        </dl>

        {showActions && (
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
            <div>
              <p className="text-muted-foreground text-xs">Starting at</p>
              <p className="font-semibold">{formatINR(worker.pricing.startingPrice)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/workers/${worker.id}`}>View profile</Link>
              </Button>
              {onRequest && (
                <Button size="sm" onClick={onRequest} icon={<BadgeCheck />}>
                  {requestLabel}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
