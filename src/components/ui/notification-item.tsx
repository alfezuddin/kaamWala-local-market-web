"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CreditCard, Settings2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/format";
import type { AppNotification, NotificationCategory } from "@/types";

const ICONS: Record<NotificationCategory, React.ElementType> = {
  BOOKING: Bell,
  PAYMENT: CreditCard,
  WORKER: User,
  SYSTEM: Settings2,
};

const TONES: Record<NotificationCategory, string> = {
  BOOKING: "bg-brand-soft text-brand-soft-foreground",
  PAYMENT: "bg-success/12 text-success",
  WORKER: "bg-info/12 text-info",
  SYSTEM: "bg-muted text-muted-foreground",
};

export function NotificationItem({
  notification,
  onMarkRead,
  onClick,
  compact,
}: {
  notification: AppNotification;
  onMarkRead?: (id: string) => void;
  onClick?: () => void;
  compact?: boolean;
}) {
  const Icon = ICONS[notification.category];
  const body = (
    <>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONES[notification.category])}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className={cn("line-clamp-1 flex-1 text-[13px]", notification.isRead ? "font-medium" : "font-semibold")}>
            {notification.title}
          </span>
          {!notification.isRead && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" aria-label="Unread" />}
        </span>
        {!compact && <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-[13px]">{notification.body}</span>}
        <span className="text-muted-foreground mt-1 block text-[11px]">{formatTimeAgo(notification.createdAt)}</span>
      </span>
    </>
  );

  const className = cn(
    "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors",
    notification.isRead ? "hover:bg-accent/60" : "bg-brand-soft/30 hover:bg-brand-soft/50",
  );

  if (notification.href) {
    return (
      <Link
        href={notification.href}
        onClick={() => {
          onMarkRead?.(notification.id);
          onClick?.();
        }}
        className={cn(className, "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none")}
      >
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => onMarkRead?.(notification.id)} className={className}>
      {body}
    </button>
  );
}

export function NotificationCategoryBadge({ category }: { category: NotificationCategory }) {
  return (
    <Badge variant="outline" size="sm">
      {category.charAt(0) + category.slice(1).toLowerCase()}
    </Badge>
  );
}
