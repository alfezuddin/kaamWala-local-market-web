"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

const GRADIENTS = [
  "bg-gradient-to-br from-indigo-500 to-blue-600",
  "bg-gradient-to-br from-sky-500 to-cyan-600",
  "bg-gradient-to-br from-violet-500 to-purple-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-amber-500 to-orange-600",
  "bg-gradient-to-br from-rose-500 to-pink-600",
  "bg-gradient-to-br from-teal-500 to-emerald-600",
  "bg-gradient-to-br from-fuchsia-500 to-violet-600",
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function AvatarCircle({
  name,
  size = "md",
  className,
  showRing,
  online,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showRing?: boolean;
  online?: boolean;
}) {
  const dim = { xs: "size-7 text-[10px]", sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-14 text-base", xl: "size-24 text-2xl" }[size];
  const gradient = GRADIENTS[hashString(name) % GRADIENTS.length];
  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar className={cn(dim, showRing && "ring-2 ring-primary ring-offset-2 ring-offset-background")}>
        <AvatarFallback className={cn(gradient, "font-semibold text-white")}>{initials(name)}</AvatarFallback>
      </Avatar>
      {online !== undefined && (
        <span
          className={cn(
            "absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-background",
            online ? "bg-success" : "bg-muted-foreground/50",
          )}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}

/** Pure-CSS visual placeholder used for service cards and hero art. */
export function ServiceVisual({
  icon,
  name,
  className,
  size = "md",
}: {
  icon?: string;
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const idx = hashString(name) % GRADIENTS.length;
  const gradient = GRADIENTS[idx];
  const pad = { sm: "p-5", md: "p-7", lg: "p-10", xl: "p-14" }[size];
  const iconSize = { sm: 24, md: 30, lg: 40, xl: 52 }[size];
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        gradient,
        pad,
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -right-6 -bottom-8 size-28 rounded-full bg-white/15 blur-2xl" />
      <div className="absolute -top-8 -left-6 size-24 rounded-full bg-black/10 blur-2xl" />
      <div className="relative flex size-full items-center justify-center">
        <DynamicIcon name={icon} className="text-white drop-shadow-sm" style={{ width: iconSize, height: iconSize }} />
      </div>
    </div>
  );
}

export function ServiceCardVisual({ icon, name, className }: { icon?: string; name: string; className?: string }) {
  return <ServiceVisual icon={icon} name={name} className={className} size="md" />;
}
