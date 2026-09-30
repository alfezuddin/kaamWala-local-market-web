"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, UserCog, X, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo, ThemeToggle } from "@/components/ui/app-logo";
import { GlobalSearch } from "@/components/features/global-search";
import { useAuth } from "@/components/providers/auth-provider";
import { homePathForRole } from "@/services/auth";
import { cn } from "@/lib/utils";

export const PUBLIC_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Find Workers", href: "/workers" },
  { label: "How it works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  // The mobile menu is open only for the route it was opened on, so navigating
  // closes it without an effect.
  const [openedOn, setOpenedOn] = React.useState<string | null>(null);
  const open = openedOn === pathname;
  const { role, session } = useAuth();

  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b border-border backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <AppLogo href="/" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {PUBLIC_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  active ? "text-primary bg-brand-soft" : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden max-w-xs flex-1 xl:block">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <ThemeToggle className="hidden sm:inline-flex" />
          {role ? (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href={homePathForRole(role)}>
                <LayoutDashboard /> Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">
                  <LogIn /> Login
                </Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
            <Link href="/worker/register">
              <UserCog /> Become a Worker
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpenedOn(open ? null : pathname)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto w-full max-w-7xl space-y-3 px-4 py-4 sm:px-6">
            <GlobalSearch />
            <nav className="grid gap-1" aria-label="Mobile">
              {PUBLIC_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:bg-accent rounded-lg px-3 py-2.5 text-sm font-medium transition"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {role ? (
                <Button asChild className="col-span-2">
                  <Link href={homePathForRole(role)}>
                    <LayoutDashboard /> Go to dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link href="/login">
                      <LogIn /> Login
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/register">
                      <UserPlus /> Register
                    </Link>
                  </Button>
                </>
              )}
              <Button asChild className="col-span-2">
                <Link href="/worker/register">
                  <UserCog /> Become a Worker
                </Link>
              </Button>
            </div>
            <div className="flex justify-end">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
      {session && <span className="sr-only">Signed in as {session.name}</span>}
    </header>
  );
}
