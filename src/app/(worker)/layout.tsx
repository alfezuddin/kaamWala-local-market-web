"use client";

import * as React from "react";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  IndianRupee,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Star,
  User,
  Wrench,
} from "lucide-react";
import { DashboardShell } from "@/components/ui/dashboard-shell";
import type { NavGroup } from "@/components/ui/sidebar-nav";
import { RoleGuard } from "@/components/features/role-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiQuery } from "@/hooks/use-api";
import { getWorkerDashboard } from "@/services/workers";
import { getUnreadCount } from "@/services/notifications";
import { ErrorState } from "@/components/ui/states";

const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/worker/dashboard", icon: LayoutDashboard },
      { title: "My Jobs", href: "/worker/jobs", icon: CalendarCheck },
      { title: "Messages", href: "/worker/chat", icon: MessageCircle },
    ],
  },
  {
    title: "Business",
    items: [
      { title: "Earnings", href: "/worker/earnings", icon: IndianRupee },
      { title: "My Services", href: "/worker/services", icon: Wrench },
      { title: "Availability", href: "/worker/availability", icon: CalendarClock },
      { title: "My reviews", href: "/worker/reviews", icon: Star },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Notifications", href: "/worker/notifications", icon: Bell },
      { title: "Profile", href: "/worker/profile", icon: User },
      { title: "Settings", href: "/worker/settings", icon: Settings },
    ],
  },
];

const BOTTOM_NAV = [
  { title: "Home", href: "/worker/dashboard", icon: LayoutDashboard },
  { title: "Jobs", href: "/worker/jobs", icon: CalendarCheck },
  { title: "Earnings", href: "/worker/earnings", icon: IndianRupee },
  { title: "Profile", href: "/worker/profile", icon: User },
];

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.userId;

  const dashboardQuery = useApiQuery(
    ["worker", "dashboard", userId],
    () => (userId ? getWorkerDashboard(userId) : Promise.resolve(null)),
    { enabled: Boolean(userId) },
  );

  const unreadQuery = useApiQuery(
    ["notifications", "unread", userId],
    () => (userId ? getUnreadCount(userId) : Promise.resolve(0)),
    { enabled: Boolean(userId) },
  );

  const groups = React.useMemo<NavGroup[]>(() => {
    const pending = dashboardQuery.data?.pending.length ?? 0;
    if (pending === 0) return NAV;
    return NAV.map((group) => ({
      ...group,
      items: group.items.map((item) =>
        item.href === "/worker/jobs" ? { ...item, badge: pending } : item,
      ),
    }));
  }, [dashboardQuery.data]);

  if (dashboardQuery.isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState onRetry={() => dashboardQuery.refetch()} />
      </div>
    );
  }

  return (
    <RoleGuard allow="WORKER">
      <DashboardShell
        groups={groups}
        panelLabel="Professional"
        headerTitle="Professional panel"
        notificationsHref="/worker/notifications"
        profileHref="/worker/profile"
        settingsHref="/worker/settings"
        unreadCount={unreadQuery.data ?? 0}
        bottomNavItems={BOTTOM_NAV}
      >
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}
