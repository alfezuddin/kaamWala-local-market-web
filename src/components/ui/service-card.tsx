"use client";

import * as React from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { ServiceVisual } from "@/components/ui/avatar-circle";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { formatINR } from "@/lib/format";
import type { Service } from "@/types";
import { cn } from "@/lib/utils";

export function ServiceCard({
  service,
  categoryName,
  onBook,
  href,
  className,
  showBook = true,
}: {
  service: Service;
  categoryName?: string;
  onBook?: () => void;
  href?: string;
  className?: string;
  showBook?: boolean;
}) {
  const target = href ?? `/services/${service.slug}`;
  return (
    <Card className={cn("group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-card", className)}>
      <Link href={target} className="focus-visible:ring-ring relative block focus-visible:ring-2 focus-visible:outline-none">
        <ServiceVisual icon={service.icon} name={service.name} className="h-36" />
        {categoryName && (
          <Badge variant="solid" size="sm" className="absolute top-3 left-3 backdrop-blur-sm">
            {categoryName}
          </Badge>
        )}
        {!service.isActive && (
          <Badge variant="destructive" size="sm" className="absolute top-3 right-3">
            Unavailable
          </Badge>
        )}
      </Link>
      <CardContent className="flex flex-1 flex-col p-4">
        <Link href={target} className="focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none">
          <h3 className="line-clamp-1 font-semibold group-hover:text-primary transition-colors">{service.name}</h3>
        </Link>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-[13px] leading-relaxed">{service.description}</p>
        <div className="mt-3 flex items-center gap-3 text-[13px]">
          <RatingStars value={service.rating || 4.5} showValue size="xs" />
          <span className="text-muted-foreground flex items-center gap-1">
            <Users className="size-3.5" />
            {service.workerCount}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div>
            <span className="text-muted-foreground text-xs">From </span>
            <span className="text-base font-bold">{formatINR(service.startingPrice)}</span>
          </div>
          {showBook && (
            <Button size="sm" onClick={onBook} disabled={!onBook} icon={<DynamicIcon name="CalendarDays" />}>
              Book Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ServiceIconTile({ icon, className }: { icon?: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-brand-soft text-brand-soft-foreground flex size-10 shrink-0 items-center justify-center rounded-lg",
        className,
      )}
    >
      <DynamicIcon name={icon} className="size-5" />
    </span>
  );
}
