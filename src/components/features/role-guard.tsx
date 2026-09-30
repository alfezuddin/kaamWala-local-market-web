"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageLoader, PermissionDenied } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useMounted } from "@/hooks/use-mounted";
import type { Role } from "@/types";

/**
 * Client-side role gate for the customer, worker and admin panels.
 *
 * The session only ever lives in localStorage, so the check has to run on the
 * client. Unauthorised visitors are redirected to sign in, and signed-in users
 * whose role does not match see an explicit permission notice rather than a
 * silent redirect.
 */
export function RoleGuard({ allow, children }: { allow: Role; children: React.ReactNode }) {
  const router = useRouter();
  const { session, isLoading, demoUser } = useAuth();
  const mounted = useMounted();

  const role = session?.role ?? demoUser?.role ?? null;
  const denied = !isLoading && session !== null && session.role !== allow;

  React.useEffect(() => {
    if (!mounted || isLoading || session) return;
    router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }, [mounted, isLoading, session, router]);

  if (!mounted || isLoading) return <PageLoader label="Checking your access…" />;

  if (!session) {
    return <PageLoader label="Redirecting to sign in…" />;
  }

  if (denied || role !== allow) {
    return (
      <PermissionDenied
        message={`This area is for ${allow.toLowerCase()} accounts. You are signed in as ${
          session.role.toLowerCase() === "admin" ? "an administrator" : `a ${session.role.toLowerCase()}`
        }.`}
      />
    );
  }

  return <>{children}</>;
}

export function RoleLanding({ home }: { home: string }) {
  const router = useRouter();
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-muted-foreground text-sm">Taking you to your dashboard…</p>
      <Button onClick={() => router.push(home)}>Go now</Button>
    </div>
  );
}
