import { byNewest, delay } from "@/lib/api";
import { getDb, mutate } from "@/mock/db";
import { getDb as dbRef } from "@/mock/db";
import type { Customer, Role, User, VerificationStatus, Worker } from "@/types";
import { adminUser } from "./auth";

export interface UserFilters {
  search?: string;
  role?: Role | "ALL";
  status?: string | "ALL";
  city?: string;
  joinedFrom?: string;
  joinedTo?: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: string;
  city: string;
  area: string;
  joinedAt: string;
  lastActiveAt: string;
  avatarSeed: string;
  categoryName?: string;
  rating?: number;
  verification?: VerificationStatus;
  completedJobs?: number;
}

export async function getAllUsers(filters: UserFilters = {}): Promise<AdminUserRow[]> {
  const db = dbRef();
  const all: AdminUserRow[] = [
    ...db.customers.map(
      (c): AdminUserRow => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: c.role,
        status: c.status,
        city: c.city,
        area: c.area,
        joinedAt: c.joinedAt,
        lastActiveAt: c.lastActiveAt,
        avatarSeed: c.avatarSeed,
        completedJobs: c.totalBookings,
      }),
    ),
    ...db.workers.map(
      (w): AdminUserRow => ({
        id: w.id,
        name: w.name,
        email: w.email,
        phone: w.phone,
        role: w.role,
        status: w.status,
        city: w.city,
        area: w.area,
        joinedAt: w.joinedAt,
        lastActiveAt: w.lastActiveAt,
        avatarSeed: w.avatarSeed,
        categoryName: db.categories.find((c) => c.id === w.categoryId)?.name,
        rating: w.rating,
        verification: w.verification,
        completedJobs: w.completedJobs,
      }),
    ),
    {
      id: adminUser().id,
      name: adminUser().name,
      email: adminUser().email,
      phone: adminUser().phone,
      role: "ADMIN",
      status: "ACTIVE",
      city: adminUser().city,
      area: adminUser().area,
      joinedAt: adminUser().joinedAt,
      lastActiveAt: adminUser().lastActiveAt,
      avatarSeed: adminUser().avatarSeed,
    },
  ];

  let list = all;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q) || u.id.includes(q),
    );
  }
  if (filters.role && filters.role !== "ALL") list = list.filter((u) => u.role === filters.role);
  if (filters.status && filters.status !== "ALL") list = list.filter((u) => u.status === filters.status);
  if (filters.city) list = list.filter((u) => u.city === filters.city);
  if (filters.joinedFrom) list = list.filter((u) => u.joinedAt >= filters.joinedFrom!);
  if (filters.joinedTo) list = list.filter((u) => u.joinedAt <= `${filters.joinedTo}T23:59:59.000Z`);
  return delay(list.sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt)), 340);
}

function findUser(id: string): Customer | Worker | null {
  const db = dbRef();
  return (db.customers.find((c) => c.id === id) as Customer) ?? db.workers.find((w) => w.id === id) ?? null;
}

export async function getUserById(id: string) {
  const user = findUser(id);
  return delay(user, 260);
}

export async function setUserStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
  return mutate((db) => {
    const user =
      db.customers.find((c) => c.id === id) ?? (db.workers.find((w) => w.id === id) as Worker | undefined);
    if (!user) throw new Error("User not found");
    user.status = status;
    return delay({ ...user }, 520);
  });
}

export async function updateUser(id: string, updates: Partial<User>) {
  return mutate((db) => {
    const user = db.customers.find((c) => c.id === id) ?? db.workers.find((w) => w.id === id);
    if (!user) throw new Error("User not found");
    Object.assign(user, updates);
    return delay({ ...user }, 520);
  });
}

export async function deleteUser(id: string) {
  return mutate((db) => {
    db.customers = db.customers.filter((c) => c.id !== id);
    db.workers = db.workers.filter((w) => w.id !== id);
    return delay(id, 480);
  });
}

export async function getPendingVerifications() {
  const db = dbRef();
  return delay(
    db.workers.filter((w) => w.verification === "PENDING").sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt)),
    320,
  );
}

export async function getWorkerVerification(id: string) {
  const db = dbRef();
  const worker = db.workers.find((w) => w.id === id) ?? null;
  if (!worker) return delay(null, 240);
  return delay(
    {
      worker,
      category: db.categories.find((c) => c.id === worker.categoryId) ?? null,
      services: db.services.filter((s) => worker.serviceIds.includes(s.id)),
      jobs: db.bookings.filter((b) => b.workerId === worker.id),
      reviews: db.reviews.filter((r) => r.workerId === worker.id),
    },
    300,
  );
}

export async function setWorkerVerification(id: string, status: VerificationStatus, reason?: string) {
  return mutate((db) => {
    const worker = db.workers.find((w) => w.id === id);
    if (!worker) throw new Error("Worker not found");
    worker.verification = status;
    worker.status = status === "REJECTED" ? "PENDING" : "ACTIVE";
    worker.verifiedAt = status === "APPROVED" ? new Date().toISOString() : undefined;
    worker.rejectionReason = status === "REJECTED" ? reason : undefined;
    if (worker.verification === "PENDING" && status !== "APPROVED") {
      worker.verification = "PENDING";
      worker.status = "PENDING";
    }
    return delay({ ...worker }, 620);
  });
}

export async function getAdminDashboard() {
  const db = dbRef();
  const bookings = db.bookings;
  const revenue = bookings.filter((b) => b.paymentStatus === "PAID").reduce((s, b) => s + b.platformFee, 0);
  const gmv = bookings.filter((b) => b.paymentStatus === "PAID").reduce((s, b) => s + b.price, 0);
  const series = db.bookingSeries;
  return delay(
    {
      stats: {
        customers: db.customers.length,
        workers: db.workers.length,
        bookings: bookings.length,
        completed: bookings.filter((b) => b.status === "COMPLETED").length,
        cancelled: bookings.filter((b) => ["CANCELLED", "REJECTED"].includes(b.status)).length,
        revenue,
        gmv,
        pendingVerification: db.workers.filter((w) => w.verification === "PENDING").length,
        openComplaints: db.complaints.filter((c) => c.status === "OPEN" || c.status === "UNDER_REVIEW").length,
      },
      series,
      categoryDistribution: db.categories.map((c) => ({
        name: c.name,
        value: bookings.filter((b) => b.categoryId === c.id).length,
      })),
      recentBookings: [...bookings]
        .sort(byNewest)
        .slice(0, 6)
        .map((b) => ({
          ...b,
          customer: db.customers.find((c) => c.id === b.customerId) ?? null,
          worker: db.workers.find((w) => w.id === b.workerId) ?? null,
          service: db.services.find((s) => s.id === b.serviceId) ?? null,
        })),
      recentWorkers: [...db.workers].sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt)).slice(0, 6),
      recentComplaints: [...db.complaints].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5),
    },
    380,
  );
}

export async function getReports() {
  const db = dbRef();
  const bookings = db.bookings;
  const revenueByCategory = db.categories.map((c) => ({
    name: c.name,
    revenue: bookings.filter((b) => b.categoryId === c.id && b.status === "COMPLETED").reduce((s, b) => s + b.price, 0),
    bookings: bookings.filter((b) => b.categoryId === c.id).length,
  }));
  const cityStats = Array.from(new Set(db.workers.map((w) => w.city))).map((city) => ({
    city,
    workers: db.workers.filter((w) => w.city === city).length,
    bookings: bookings.filter((b) => b.address.city === city).length,
  }));
  return delay(
    {
      series: db.bookingSeries,
      revenueByCategory,
      cityStats,
      totals: {
        bookings: bookings.length,
        revenue: bookings.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.price, 0),
        avgOrderValue: Math.round(
          bookings.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.price, 0) /
            Math.max(1, bookings.filter((b) => b.status === "COMPLETED").length),
        ),
        completionRate: Number(
          ((bookings.filter((b) => b.status === "COMPLETED").length / Math.max(1, bookings.length)) * 100).toFixed(1),
        ),
        topWorkers: [...db.workers]
          .filter((w) => w.verification === "APPROVED")
          .sort((a, b) => b.completedJobs - a.completedJobs)
          .slice(0, 5),
      },
    },
    360,
  );
}

export async function getPayments(filters: { status?: string; method?: string; search?: string } = {}) {
  const db = dbRef();
  let list = [...db.transactions].sort(byNewest);
  if (filters.status && filters.status !== "ALL") list = list.filter((t) => t.status === filters.status);
  if (filters.method && filters.method !== "ALL") list = list.filter((t) => t.method === filters.method);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (t) => t.id.toLowerCase().includes(q) || t.invoiceNo.toLowerCase().includes(q) || t.bookingId.toLowerCase().includes(q),
    );
  }
  return delay(
    list.map((t) => ({
      ...t,
      customer: db.customers.find((c) => c.id === t.customerId) ?? null,
      worker: db.workers.find((w) => w.id === t.workerId) ?? null,
      booking: db.bookings.find((b) => b.id === t.bookingId) ?? null,
    })),
    340,
  );
}

export { getDb };
