"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search, Settings, User as UserIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { AppLogo, ThemeToggle } from "@/components/ui/app-logo";
import { GlobalSearch } from "@/components/features/global-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BottomNav, SidebarNav, type NavGroup, type NavItem } from "@/components/ui/sidebar-nav";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardShell({
  groups,
  notificationsHref,
  unreadCount = 0,
  profileHref,
  settingsHref,
  children,
  bottomNavItems,
  panelLabel = "KaamWala",
  headerTitle,
}: {
  groups: NavGroup[];
  notificationsHref: string;
  unreadCount?: number;
  profileHref: string;
  settingsHref: string;
  children: React.ReactNode;
  bottomNavItems?: NavItem[];
  panelLabel?: string;
  headerTitle?: string;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { demoUser, signOut, role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const currentLabel = React.useMemo(() => {
    for (const group of groups) {
      for (const item of group.items) {
        if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return item.title;
      }
    }
    return headerTitle ?? "Dashboard";
  }, [groups, pathname, headerTitle]);

  return (
    <div className="bg-muted/40 min-h-dvh">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground sr-only rounded-md px-4 py-2 text-sm focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-sidebar-border lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <AppLogo href="/" />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <SidebarNav groups={groups} />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/"
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition"
          >
            <ChevronRight className="size-4 rotate-180" />
            Back to website
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border px-4 backdrop-blur-md sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="flex h-16 items-center border-b border-sidebar-border px-4">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <AppLogo href="/" />
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarNav groups={groups} onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-sidebar-border p-3">
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild onClick={() => setMobileOpen(false)}>
                  <Link href="/">Back to website</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden min-w-0 lg:block">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">{panelLabel}</p>
            <h1 className="truncate text-base font-semibold">{currentLabel}</h1>
          </div>
          <div className="lg:hidden">
            <AppLogo href="/" size="sm" />
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <GlobalSearch className="hidden md:block md:w-64 lg:w-72" />
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => router.push("/search")}>
              <Search />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}>
              <Link href={notificationsHref} className="relative">
                <Bell />
                {unreadCount > 0 && (
                  <span className="bg-destructive text-white absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="focus-visible:ring-ring flex items-center gap-2 rounded-full p-0.5 transition focus-visible:ring-2 focus-visible:outline-none"
                  aria-label="Account menu"
                >
                  <AvatarCircle name={demoUser?.name ?? "User"} size="sm" />
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[120px] truncate text-[13px] font-semibold">
                      {demoUser?.name ?? "Account"}
                    </span>
                    <span className="text-muted-foreground block text-[11px] capitalize">{role?.toLowerCase()}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="normal-case">
                  <span className="block text-sm font-semibold text-foreground">{demoUser?.name}</span>
                  <span className="block truncate text-[11px] font-normal normal-case">{demoUser?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={profileHref}>
                    <UserIcon /> My profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={settingsHref}>
                    <Settings /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={notificationsHref}>
                    <Bell /> Notifications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => signOut()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="main-content" className={cn("px-4 py-6 sm:px-6 lg:px-8", bottomNavItems && "pb-24 lg:pb-8")}>
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>

      {bottomNavItems && bottomNavItems.length > 0 && <BottomNav items={bottomNavItems} />}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="text-muted-foreground flex flex-wrap items-center gap-1 text-[13px]">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.label} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3.5 opacity-50" aria-hidden />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon && <span className="bg-brand-soft text-brand mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg [&>svg]:size-4">{icon}</span>}
            <div className="min-w-0">
              <CardTitle className="text-base">{title}</CardTitle>
              {description && <p className="text-muted-foreground mt-0.5 text-[13px]">{description}</p>}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function InfoBanner({
  title,
  description,
  action,
  icon,
  variant = "info",
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "info" | "success" | "warning";
}) {
  const styles = {
    info: "border-info/30 bg-info/8 text-foreground",
    success: "border-success/30 bg-success/8 text-foreground",
    warning: "border-warning/40 bg-warning/10 text-foreground",
  }[variant];
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center", styles)}>
      {icon && <span className="shrink-0 [&>svg]:size-5">{icon}</span>}
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground mt-0.5 text-[13px]">{description}</p>
      </div>
      {action}
    </div>
  );
}

export { Badge };
