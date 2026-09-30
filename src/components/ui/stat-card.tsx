"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  trendLabel,
  href,
  className,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  href?: string;
  className?: string;
  tone?: "brand" | "success" | "warning" | "info";
}) {
  const tones = {
    brand: "bg-brand-soft text-brand-soft-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning-foreground dark:text-warning",
    info: "bg-info/12 text-info",
  };
  const content = (
    <Card className={cn("h-full transition-shadow", href && "hover:shadow-card", className)}>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          {(hint || trend !== undefined) && (
            <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
              {trend !== undefined && (
                <span className={cn("font-semibold", trend >= 0 ? "text-success" : "text-destructive")}>
                  {trend >= 0 ? "+" : ""}
                  {trend}%
                </span>
              )}
              {trendLabel ?? hint}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5", tones[tone])}>
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
  if (!href) return content;
  return (
    <a href={href} className="block rounded-xl focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none">
      {content}
    </a>
  );
}
