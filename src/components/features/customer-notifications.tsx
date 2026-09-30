"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck, CreditCard, Info, Sparkles, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/notifications";
import { formatDateTime, formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationCategory } from "@/types";

const CATEGORIES: { value: NotificationCategory | "ALL"; label: string; icon: React.ElementType }[] = [
  { value: "ALL", label: "All", icon: Bell },
  { value: "BOOKING", label: "Bookings", icon: Sparkles },
  { value: "PAYMENT", label: "Payments", icon: CreditCard },
  { value: "WORKER", label: "Professionals", icon: UserCheck },
  { value: "SYSTEM", label: "System", icon: Info },
];

const TONE: Record<NotificationCategory, string> = {
  BOOKING: "bg-info/12 text-info",
  PAYMENT: "bg-success/12 text-success",
  WORKER: "bg-brand-soft text-brand",
  SYSTEM: "bg-muted text-muted-foreground",
};

export function CustomerNotificationsPage({ homeHref = "/customer/dashboard", role = "CUSTOMER" }: { homeHref?: string; role?: "CUSTOMER" | "WORKER" } = {}) {
  const toast = useToast();
  const { session } = useAuth();
  const userId = session?.userId;
  const [category, setCategory] = React.useState<NotificationCategory | "ALL">("ALL");

  const query = useApiQuery(
    ["notifications", userId, category],
    () => (userId ? getNotifications(userId, category) : Promise.resolve<AppNotification[]>([])),
    { enabled: Boolean(userId) },
  );

  const markOne = useApiMutation((id: string) => markNotificationRead(id), {
    onSuccess: () => {
      query.refetch();
    },
    onError: (error) => toast.error("Could not update notification", error.message),
  });

  const markAll = useApiMutation(() => (userId ? markAllNotificationsRead(userId) : Promise.resolve(true)), {
    onSuccess: () => {
      const count = unread.length;
      toast.success("All caught up", `${count} notification${count === 1 ? "" : "s"} marked as read.`);
      query.refetch();
    },
    onError: (error) => toast.error("Could not mark notifications", error.message),
  });

  const notifications = query.data ?? [];
  const unread = notifications.filter((n) => !n.isRead);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Booking updates, payment receipts and platform announcements."
        breadcrumbs={[{ label: "Account", href: homeHref }, { label: "Notifications" }]}
        actions={
          <Button
            variant="outline"
            onClick={() => markAll.mutate()}
            loading={markAll.isPending}
            disabled={unread.length === 0}
            icon={<CheckCheck />}
          >
            Mark all as read
          </Button>
        }
      />

      <Tabs value={category} onValueChange={(v) => setCategory(v as NotificationCategory | "ALL")}>
        <TabsList className="flex-wrap">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.value} value={c.value}>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <SectionLoader label="Loading notifications…" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="bell"
          title="Nothing to show"
          description={category === "ALL" ? "Nothing here yet. Updates will appear as they happen." : "No notifications in this category yet."}
          actionLabel={category === "ALL" ? (role === "WORKER" ? "Browse open jobs" : "Book a service") : "View all notifications"}
          actionHref={category === "ALL" ? (role === "WORKER" ? "/worker/jobs" : "/customer/book/new") : undefined}
          onAction={category === "ALL" ? undefined : () => setCategory("ALL")}
        />
      ) : (
        <Card>
          <CardContent className="divide-border divide-y p-0">
            {notifications.map((n) => {
              const Icon = CATEGORIES.find((c) => c.value === n.category)?.icon ?? Bell;
              const body = (
                <>
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", TONE[n.category])}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("text-sm", n.isRead ? "font-medium" : "font-semibold")}>{n.title}</p>
                      {!n.isRead && (
                        <Badge variant="solid" size="sm">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-[13px] leading-relaxed">{n.body}</p>
                    <p className="text-muted-foreground mt-1 text-xs" title={formatDateTime(n.createdAt)}>
                      {formatTimeAgo(n.createdAt)}
                    </p>
                  </div>
                </>
              );

              return (
                <div
                  key={n.id}
                  className={cn("flex items-start gap-3 p-4 transition", !n.isRead && "bg-brand-soft/25")}
                >
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={() => !n.isRead && markOne.mutate(n.id)}
                      className="flex min-w-0 flex-1 items-start gap-3"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-start gap-3">{body}</div>
                  )}
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => markOne.mutate(n.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
