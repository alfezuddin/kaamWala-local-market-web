"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatINR, formatRelativeDay } from "@/lib/format";
import type { Booking, Service, Worker } from "@/types";
import { cn } from "@/lib/utils";

export function BookingCard({
  booking,
  worker,
  service,
  href,
  actions,
  footer,
  className,
}: {
  booking: Booking;
  worker?: Worker | null;
  service?: Service | null;
  href: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-card", className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={href}
                className="focus-visible:ring-ring rounded font-mono text-[13px] font-semibold hover:text-primary hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                {booking.id}
              </Link>
              <StatusBadge status={booking.status} />
              {booking.paymentStatus === "PAID" && <StatusBadge status="PAID" size="sm" />}
            </div>
            <h3 className="mt-1.5 font-semibold">{booking.title}</h3>
            {service && <p className="text-muted-foreground text-[13px]">{service.name}</p>}
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Estimated</p>
            <p className="text-lg font-bold tabular-nums">{formatINR(booking.price)}</p>
          </div>
        </div>

        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatRelativeDay(booking.scheduledDate)}, {booking.scheduledTime}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {booking.address.area}, {booking.address.city}
          </span>
          {worker && (
            <Link href={`/workers/${worker.id}`} className="flex items-center gap-1.5 hover:text-primary">
              <Clock className="size-3.5" />
              {worker.name}
            </Link>
          )}
        </div>

        {footer}

        {actions && <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">{actions}</div>}
      </CardContent>
    </Card>
  );
}

export function BookingTimeline({ timeline }: { timeline: Booking["timeline"] }) {
  const flow = ["REQUESTED", "ACCEPTED", "CONFIRMED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED"] as const;
  const currentIndex = Math.max(
    0,
    timeline.filter((t) => (flow as readonly string[]).includes(t.status)).length - 1,
  );
  const isCancelled = timeline.some((t) => t.status === "CANCELLED" || t.status === "REJECTED");
  return (
    <ol className="relative space-y-0">
      {flow.map((status, i) => {
        const entry = [...timeline].reverse().find((t) => t.status === status);
        const done = !isCancelled && i <= currentIndex;
        const active = !isCancelled && i === currentIndex;
        return (
          <li key={status} className="relative flex gap-3 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-card transition-colors",
                  done ? "border-primary bg-primary" : "border-border",
                  isCancelled && "border-destructive/50",
                )}
              >
                <span className={cn("size-1.5 rounded-full", done ? "bg-primary-foreground" : "bg-border")} />
              </span>
              {i < flow.length - 1 && (
                <span className={cn("w-0.5 flex-1", done && !active ? "bg-primary" : "bg-border")} />
              )}
            </div>
            <div className="-mt-0.5 min-w-0 flex-1 pb-1">
              <p className={cn("text-sm font-medium capitalize", !done && "text-muted-foreground")}>
                {status.toLowerCase().replace(/_/g, " ")}
                {active && <span className="text-primary ml-2 text-xs font-semibold">Current</span>}
              </p>
              {entry && (
                <p className="text-muted-foreground text-xs">
                  {new Date(entry.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  {entry.note ? ` · ${entry.note}` : ""}
                </p>
              )}
            </div>
          </li>
        );
      })}
      {isCancelled && (
        <li className="flex gap-3">
          <span className="bg-destructive z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-destructive">
            <span className="size-1.5 rounded-full bg-destructive-foreground" />
          </span>
          <div className="-mt-0.5">
            <p className="text-destructive text-sm font-semibold">Booking cancelled</p>
            <p className="text-muted-foreground text-xs">
              {[...timeline].reverse().find((t) => t.status === "CANCELLED" || t.status === "REJECTED")?.note}
            </p>
          </div>
        </li>
      )}
    </ol>
  );
}

export function BookingLinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href={href}>
        {children}
        <ChevronRight />
      </Link>
    </Button>
  );
}
