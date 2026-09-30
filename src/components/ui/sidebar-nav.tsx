"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  exact?: boolean;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export function SidebarNav({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-5 p-3" aria-label="Sidebar">
      {groups.map((group, i) => (
        <div key={group.title ?? `group-${i}`} className="space-y-1">
          {group.title && (
            <p className="text-muted-foreground px-3 pb-1 text-[11px] font-semibold tracking-widest uppercase">
              {group.title}
            </p>
          )}
          {group.items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group focus-visible:ring-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1 truncate">{item.title}</span>
                {item.badge ? (
                  <span className="bg-primary text-primary-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function BottomNav({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary mobile navigation"
      className={cn(
        "bg-card/95 supports-[backdrop-filter]:bg-card/80 fixed inset-x-0 bottom-0 z-40 border-t border-border backdrop-blur-md lg:hidden",
        className,
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring relative flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {item.badge ? (
                    <span className="bg-destructive text-white absolute -top-1.5 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="truncate">{item.title}</span>
                {active && <span className="bg-primary absolute top-0 h-0.5 w-8 rounded-full" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
