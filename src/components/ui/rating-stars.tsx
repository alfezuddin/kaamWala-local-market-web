"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  size = "sm",
  showValue = true,
  count,
  className,
}: {
  value: number;
  size?: "xs" | "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
  className?: string;
}) {
  const px = { xs: 12, sm: 14, md: 18, lg: 24 }[size];
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = rounded - i;
          return (
            <span key={i} className="relative inline-block" style={{ width: px, height: px }}>
              <Star className="absolute inset-0 text-muted-foreground/35" style={{ width: px, height: px }} />
              {filled > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${Math.min(1, Math.max(0, filled)) * 100}%` }}
                >
                  <Star className="fill-amber-400 text-amber-400" style={{ width: px, height: px }} />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className={cn("font-medium", size === "lg" ? "text-base" : "text-[13px]")}>{value.toFixed(1)}</span>
      )}
      {count !== undefined && <span className="text-muted-foreground text-[13px]">({count})</span>}
    </div>
  );
}

export function RatingInput({
  value,
  onChange,
  size = 32,
  error,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  error?: string;
}) {
  const [hover, setHover] = React.useState(0);
  const display = hover || value;
  return (
    <div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(0)}
            className={cn(
              "focus-visible:ring-ring rounded p-0.5 transition-transform focus-visible:ring-2 focus-visible:outline-none",
              display >= i ? "scale-105" : "opacity-60 hover:opacity-100",
            )}
          >
            <Star
              className={cn("transition-colors", display >= i ? "fill-amber-400 text-amber-400" : "text-muted-foreground/50")}
              style={{ width: size, height: size }}
            />
          </button>
        ))}
        {value > 0 && <span className="text-muted-foreground ml-2 text-sm">{value} / 5</span>}
      </div>
      {error && <p className="text-destructive mt-1.5 text-[13px]">{error}</p>}
    </div>
  );
}
