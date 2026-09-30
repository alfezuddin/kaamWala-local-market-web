"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { writeSession, SESSION_EVENT, SESSION_KEY, type AuthSession } from "@/services/auth";
import { useMounted } from "@/hooks/use-mounted";
import type { Role, User } from "@/types";

/**
 * The session lives in localStorage, so it is read through
 * `useSyncExternalStore`: the server snapshot is always "signed out" and the
 * real value arrives on hydration without an extra render pass.
 */
function subscribeToSession(onChange: () => void) {
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

let cachedRaw: string | null = null;
let cachedSession: AuthSession | null = null;

function getSessionSnapshot(): AuthSession | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
  // `useSyncExternalStore` needs an identical reference while nothing changed.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSession = raw ? (JSON.parse(raw) as AuthSession) : null;
  }
  return cachedSession;
}

function getServerSession(): AuthSession | null {
  return null;
}

interface AuthContextValue {
  session: AuthSession | null;
  role: Role | null;
  isLoading: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
  demoUser: User | null;
}

const AuthContext = React.createContext<AuthContextValue>({
  session: null,
  role: null,
  isLoading: true,
  signIn: () => undefined,
  signOut: () => undefined,
  demoUser: null,
});

const DEMO_USERS: Record<Role, User> = {
  CUSTOMER: {
    id: "cus_demo",
    name: "Aarav Sharma",
    email: "customer@kaamwala.com",
    phone: "+91 98765 43210",
    role: "CUSTOMER",
    status: "ACTIVE",
    avatarSeed: "bg-indigo-500",
    city: "Indore",
    pincode: "452001",
    address: "12, MG Road",
    area: "Vijay Nagar",
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
  WORKER: {
    id: "wrk_demo",
    name: "Rajesh Kumar",
    email: "worker@kaamwala.com",
    phone: "+91 98111 22334",
    role: "WORKER",
    status: "ACTIVE",
    avatarSeed: "bg-indigo-500",
    city: "Indore",
    pincode: "452001",
    address: "18, Rajwada Main Road",
    area: "Rajwada",
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
  ADMIN: {
    id: "adm_demo",
    name: "KaamWala Admin",
    email: "admin@kaamwala.com",
    phone: "+91 90000 00000",
    role: "ADMIN",
    status: "ACTIVE",
    avatarSeed: "bg-indigo-500",
    city: "Indore",
    pincode: "452001",
    address: "KaamWala HQ",
    area: "Vijay Nagar",
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = React.useSyncExternalStore(subscribeToSession, getSessionSnapshot, getServerSession);
  const mounted = useMounted();
  const isLoading = !mounted;
  const router = useRouter();
  const pathname = usePathname();

  const signIn = React.useCallback((next: AuthSession) => {
    writeSession(next);
  }, []);

  const signOut = React.useCallback(() => {
    writeSession(null);
    router.push("/login");
  }, [router]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      role: session?.role ?? null,
      isLoading,
      signIn,
      signOut,
      demoUser: session ? DEMO_USERS[session.role] : null,
    }),
    [session, isLoading, signIn, signOut],
  );

  React.useEffect(() => {
    if (typeof window !== "undefined") (window as unknown as { pathname: string }).pathname = pathname;
  }, [pathname]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}

export { DEMO_USERS };
