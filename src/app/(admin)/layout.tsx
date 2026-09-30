"use client";

import * as React from "react";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  MessageSquareWarning,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { DashboardShell } from "@/components/ui/dashboard-shell";
import type { NavGroup } from "@/components/ui/sidebar-nav";
import { RoleGuard } from "@/components/features/role-guard";
import { useApiQuery } from "@/hooks/use-api";
import { getAdminDashboard } from "@/services/admin";
import { ErrorState } from "@/components/ui/states";

const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    title: "People",
    items: [
      { title: "Professionals", href: "/admin/workers", icon: Wrench },
      { title: "Customers", href: "/admin/customers", icon: Users },
      { title: "Verifications", href: "/admin/verifications", icon: ShieldCheck },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
      { title: "Payments", href: "/admin/payments", icon: CreditCard },
      { title: "Complaints", href: "/admin/complaints", icon: MessageSquareWarning },
      { title: "Support chat", href: "/admin/chat", icon: MessagesSquare },
      { title: "Reviews", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    title: "Catalog",
    items: [
      { title: "Services", href: "/admin/services", icon: FolderTree },
      { title: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

const BOTTOM_NAV = [
  { title: "Home", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Jobs", href: "/admin/bookings", icon: CalendarCheck },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "Alerts", href: "/admin/complaints", icon: Bell },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const dashboardQuery = useApiQuery(["admin", "dashboard"], () => getAdminDashboard());

  const groups = React.useMemo<NavGroup[]>(() => {
    const stats = dashboardQuery.data?.stats;
    if (!stats) return NAV;
    const badges: Record<string, number> = {
      "/admin/verifications": stats.pendingVerification,
      "/admin/complaints": stats.openComplaints,
    };
    return NAV.map((group) => ({
      ...group,
      items: group.items.map((item) =>
        badges[item.href] ? { ...item, badge: badges[item.href] } : item,
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
    <RoleGuard allow="ADMIN">
      <DashboardShell
        groups={groups}
        panelLabel="Admin"
        headerTitle="Admin console"
        notificationsHref="/admin/complaints"
        profileHref="/admin/settings"
        settingsHref="/admin/settings"
        unreadCount={dashboardQuery.data?.stats.openComplaints ?? 0}
        bottomNavItems={BOTTOM_NAV}
      >
        {children}
      </DashboardShell>
    </RoleGuard>
  );
}
