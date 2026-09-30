"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, Ban, Inbox, Loader2, RefreshCw, SearchX, ServerCrash, WifiOff } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type EmptyIcon = "inbox" | "search" | "book" | "chat" | "bell" | "alert" | "data";

const ICONS: Record<string, React.ElementType> = {
  inbox: Inbox,
  search: SearchX,
  book: Inbox,
  chat: Inbox,
  bell: Inbox,
  alert: AlertCircle,
  data: ServerCrash,
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon = "inbox",
  className,
  compact,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: EmptyIcon;
  className?: string;
  compact?: boolean;
}) {
  const Icon = ICONS[icon] ?? Inbox;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 text-center",
        compact ? "px-5 py-8" : "px-6 py-14",
        className,
      )}
    >
      <div className="bg-brand-soft text-brand-soft-foreground mb-4 flex size-14 items-center justify-center rounded-full">
        <Icon className="size-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">{description}</p>}
      {actionLabel && (actionHref || onAction) && (
        <Button className="mt-5" size="sm" {...(actionHref ? { asChild: true } : { onClick: onAction })}>
          {actionHref ? <Link href={actionHref}>{actionLabel}</Link> : actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this content. Please try again in a moment.",
  onRetry,
  className,
  offline,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  offline?: boolean;
}) {
  const Icon = offline ? WifiOff : ServerCrash;
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-14 text-center", className)}>
      <div className="bg-destructive/10 text-destructive mb-4 flex size-14 items-center justify-center rounded-full">
        <Icon className="size-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">{description}</p>
      {onRetry && (
        <Button className="mt-5" variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw />}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function PermissionDenied({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
      <div className="bg-warning/15 text-warning-foreground mb-4 flex size-14 items-center justify-center rounded-full dark:text-warning">
        <Ban className="size-6" />
      </div>
      <h1 className="text-xl font-semibold">Permission denied</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {message ?? "You don't have permission to access this page. Switch to an account with the required role."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild size="sm">
          <Link href="/">Go to homepage</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/login">Switch account</Link>
        </Button>
      </div>
    </div>
  );
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="border-destructive/30 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm">
      <AlertCircle className="size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <Button size="xs" variant="ghost" onClick={onRetry} icon={<RefreshCw />}>
          Retry
        </Button>
      )}
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="flex flex-col items-center gap-3">
      <Loader2 className="text-primary size-7 animate-spin" aria-hidden />
      <span className="text-muted-foreground text-sm">{label}</span>
    </span>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60dvh] w-full items-center justify-center px-4">
      <Spinner label={label} />
    </div>
  );
}

export function SectionLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[12rem] w-full items-center justify-center py-10">
      <Spinner label={label} />
    </div>
  );
}

export function InlineLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex w-full items-center justify-center py-6">
      <Spinner label={label} />
    </div>
  );
}
