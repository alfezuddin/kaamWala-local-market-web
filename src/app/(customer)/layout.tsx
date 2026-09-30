"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  Compass,
  CreditCard,
  HeartHandshake,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Star,
  User,
} from "lucide-react";
import { DashboardShell } from "@/components/ui/dashboard-shell";
import type { NavGroup } from "@/components/ui/sidebar-nav";
import { RoleGuard } from "@/components/features/role-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiQuery } from "@/hooks/use-api";
import { getCustomerDashboard } from "@/services/bookings";
import { getUnreadCount } from "@/services/notifications";
import { ErrorState } from "@/components/ui/states";

const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
      { title: "Book a service", href: "/customer/book/new", icon: CalendarPlus },
    ],
  },
  {
    title: "Activity",
    items: [
      { title: "My Bookings", href: "/customer/bookings", icon: CalendarCheck },
      { title: "Reviews", href: "/customer/reviews", icon: Star },
      { title: "Complaints", href: "/customer/complaints", icon: HeartHandshake },
      { title: "Messages", href: "/customer/chat", icon: MessageCircle },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Payments", href: "/customer/payments", icon: CreditCard },
      { title: "Notifications", href: "/customer/notifications", icon: Bell },
      { title: "Profile", href: "/customer/profile", icon: User },
      { title: "Settings", href: "/customer/settings", icon: Settings },
    ],
  },
];

const BOTTOM_NAV = [
  { title: "Home", href: "/customer/dashboard", icon: LayoutDashboard },
  { title: "Explore", href: "/services", icon: Compass },
  { title: "Bookings", href: "/customer/bookings", icon: CalendarCheck },
  { title: "Profile", href: "/customer/profile", icon: User },
];

export default function CustomerLayoutRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.userId;

  const dashboardQuery = useApiQuery(
    ["customer", "dashboard", userId],
    () => (userId ? getCustomerDashboard(userId) : Promise.resolve(null)),
    { enabled: Boolean(userId) },
  );
  const unreadQuery = useApiQuery(
    ["notifications", "unread", userId],
    () => (userId ? getUnreadCount(userId) : Promise.resolve(0)),
    { enabled: Boolean(userId) },
  );

  const groups = React.useMemo<NavGroup[]>(() => {
    if (!dashboardQuery.data) return NAV;
    const active = dashboardQuery.data.stats.active;
    return NAV.map((group) => ({
      ...group,
      items: group.items.map((item: NavGroup["items"][number]) =>
        item.href === "/customer/bookings" && active > 0 ? { ...item, badge: active } : item,
      ),
    }));
  }, [dashboardQuery.data]);

  if (dashboardQuery.isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState onRetry={() => { dashboardQuery.refetch(); router.refresh(); }} />
      </div>
    );
  }

  return (
    <RoleGuard allow="CUSTOMER">
      <DashboardShell
        groups={groups}
        panelLabel="Customer"
        headerTitle="Customer panel"
        notificationsHref="/customer/notifications"
        profileHref="/customer/profile"
        settingsHref="/customer/settings"
        unreadCount={unreadQuery.data ?? 0}
        bottomNavItems={BOTTOM_NAV}
      >
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}
