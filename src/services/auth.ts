import { DEMO_ACCOUNTS } from "@/lib/constants";
import { delay, makeId } from "@/lib/api";
import { getDb, mutate } from "@/mock/db";
import type { Address, Customer, Role, User, Worker } from "@/types";

export interface AuthSession {
  userId: string;
  role: Role;
  name: string;
  email: string;
  issuedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  role?: Role;
}

export interface RegisterCustomerPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  city: string;
}

export interface RegisterWorkerPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  categoryId: string;
  city: string;
}

export const SESSION_KEY = "kaamwala.session.v1";
export const DRAFT_WORKER_KEY = "kaamwala.worker.draft.v1";
export const SESSION_EVENT = "kaamwala:session-changed";

export function writeSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function toSession(user: User): AuthSession {
  return { userId: user.id, role: user.role, name: user.name, email: user.email, issuedAt: new Date().toISOString() };
}

export function homePathForRole(role: Role) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "WORKER") return "/worker/dashboard";
  return "/customer/dashboard";
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const account = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === payload.email.trim().toLowerCase() && a.password === payload.password,
  );
  if (!account) {
    await delay(null, 420);
    throw new Error("Invalid email or password. Use one of the demo accounts below.");
  }
  const db = getDb();
  const matched =
    account.role === "CUSTOMER"
      ? (db.customers.find((c) => c.email === account.email) as User | undefined)
      : account.role === "WORKER"
        ? (db.workers.find((w) => w.email === account.email) as User | undefined)
        : undefined;
  if (account.role !== "ADMIN" && !matched) {
    throw new Error("That demo account is missing from local data. Clear site data to reseed the demo.");
  }
  const resolved: User =
    matched ??
    ({
      id: "adm_demo",
      name: "KaamWala Admin",
      email: "admin@kaamwala.com",
      phone: "+91 90000 00000",
      role: "ADMIN",
      status: "ACTIVE",
      avatarSeed: "bg-indigo-500",
      city: "Indore",
      pincode: "452001",
      address: "HQ, Vijay Nagar",
      area: "Vijay Nagar",
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isOnline: true,
    } as User);
  const session = toSession(resolved);
  writeSession(session);
  return delay(session, 620);
}

export async function registerCustomer(payload: RegisterCustomerPayload): Promise<AuthSession> {
  const db = getDb();
  const customer: Customer = {
    id: makeId("cus"),
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    role: "CUSTOMER",
    status: "ACTIVE",
    avatarSeed: "bg-indigo-500",
    city: payload.city,
    pincode: "452001",
    address: "",
    area: "",
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    isOnline: true,
    totalBookings: 0,
    totalSpent: 0,
    savedAddresses: [],
  };
  db.customers.unshift(customer);
  const session = toSession(customer);
  writeSession(session);
  return delay(session, 700);
}

export async function registerWorker(payload: RegisterWorkerPayload): Promise<AuthSession> {
  const db = getDb();
  const category = db.categories.find((c) => c.id === payload.categoryId);
  const worker: Worker = {
    id: makeId("wrk"),
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    role: "WORKER",
    status: "PENDING",
    avatarSeed: "bg-sky-600",
    city: payload.city,
    pincode: "452001",
    address: "",
    area: "",
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    isOnline: true,
    headline: `${category?.name ?? "Service"} professional`,
    about: "",
    categoryId: payload.categoryId,
    subcategoryIds: category?.subcategories.slice(0, 2).map((s) => s.id) ?? [],
    serviceIds: db.services.filter((s) => s.categoryId === payload.categoryId).map((s) => s.id),
    skills: [],
    experienceYears: 1,
    rating: 0,
    reviewCount: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    verification: "PENDING",
    pricing: { visitCharge: 299, startingPrice: 399, hourlyPrice: 249, minJobAmount: 299 },
    areas: [],
    availability: [1, 2, 3, 4, 5, 6].map((day) => ({ day, enabled: true, start: "09:00", end: "19:00" })),
    emergencyAvailable: false,
    languages: ["Hindi", "English"],
    documents: [],
    blockedDates: [],
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
  db.workers.unshift(worker);
  const session = toSession(worker);
  writeSession(session);
  return delay(session, 800);
}

export async function logout() {
  writeSession(null);
  return delay(true, 200);
}

export async function sendOtp(identifier: string) {
  return delay({ sent: true, identifier, otp: "123456" }, 650);
}

export async function verifyOtp(identifier: string, otp: string) {
  if (otp !== "123456") throw new Error("Incorrect OTP. Use 123456 for this demo.");
  return delay({ verified: true, identifier }, 650);
}

export async function requestPasswordReset(identifier: string) {
  return delay({ sent: true, identifier }, 700);
}

export async function resetPassword(identifier: string, password: string) {
  if (password.length < 8) {
    throw new Error("Choose a password with at least 8 characters.");
  }
  return delay({ updated: true, identifier }, 800);
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<User, "name" | "email" | "phone" | "address" | "area" | "city" | "pincode"> & { bio?: string }>,
): Promise<User> {
  return mutate((store) => {
    const customer = store.customers.find((c) => c.id === userId) as Customer | undefined;
    const worker = store.workers.find((w) => w.id === userId);
    if (customer) Object.assign(customer, updates);
    if (worker) Object.assign(worker, updates);
    if (!customer && !worker) throw new Error("Account not found");
    return delay((customer ?? worker) as User, 480);
  });
}

export async function updateCustomerAddresses(userId: string, addresses: Address[]) {
  return mutate((db) => {
    const customer = db.customers.find((c) => c.id === userId);
    if (!customer) throw new Error("Account not found");
    customer.savedAddresses = addresses;
    return delay(addresses, 420);
  });
}

export function adminUser(): User {
  return {
    id: "adm_demo",
    name: "KaamWala Admin",
    email: "admin@kaamwala.com",
    phone: "+91 90000 00000",
    role: "ADMIN",
    status: "ACTIVE",
    avatarSeed: "bg-indigo-500",
    city: "Indore",
    pincode: "452001",
    address: "KaamWala HQ, Vijay Nagar",
    area: "Vijay Nagar",
    joinedAt: new Date(2023, 0, 12).toISOString(),
    lastActiveAt: new Date().toISOString(),
    isOnline: true,
  };
}
