import { byNewest, delay, makeId } from "@/lib/api";
import { todayKey } from "@/lib/format";
import { getDb, mutate } from "@/mock/db";
import type { Booking, BookingStatus, PaymentMethod, Review, Worker } from "@/types";

export interface CreateBookingInput {
  customerId: string;
  workerId: string;
  serviceId: string;
  title: string;
  description: string;
  notes?: string;
  images: string[];
  address: Booking["address"];
  scheduledDate: string;
  scheduledTime: string;
  isFlexible: boolean;
  paymentMethod: PaymentMethod;
}

export interface WorkerFilters {
  search?: string;
  categoryId?: string;
  subcategoryId?: string;
  city?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDistance?: number;
  availableOnly?: boolean;
  minExperience?: number;
  sort?: "recommended" | "rating" | "price_asc" | "price_desc" | "distance";
}

export function estimatedPrice(worker: Worker, serviceId: string) {
  const service = getDb().services.find((s) => s.id === serviceId);
  const base = service?.startingPrice ?? worker.pricing.startingPrice;
  return Math.max(base, worker.pricing.minJobAmount) + worker.pricing.visitCharge;
}

/** Deterministic pseudo distance so the demo list is stable between renders. */
export function distanceBetween(worker: Worker, city?: string, area?: string) {
  if (area && worker.areas.includes(area)) return 1.2;
  if (city && worker.city !== city) return 6 + ((worker.id.length * 7) % 22);
  return 1 + ((worker.id.length * 3) % 9);
}

export async function getWorkers(filters: WorkerFilters = {}) {
  const db = getDb();
  let list = db.workers.filter((w) => w.verification === "APPROVED" && w.status === "ACTIVE");

  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter((w) => {
      const cat = db.categories.find((c) => c.id === w.categoryId)?.name ?? "";
      return (
        w.name.toLowerCase().includes(q) ||
        w.headline.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        w.skills.some((s) => s.toLowerCase().includes(q)) ||
        w.city.toLowerCase().includes(q)
      );
    });
  }
  if (filters.categoryId) list = list.filter((w) => w.categoryId === filters.categoryId);
  if (filters.subcategoryId) list = list.filter((w) => w.subcategoryIds.includes(filters.subcategoryId!));
  if (filters.city) list = list.filter((w) => w.city === filters.city);
  if (filters.area) list = list.filter((w) => w.areas.includes(filters.area!));
  if (filters.minPrice !== undefined) list = list.filter((w) => w.pricing.startingPrice >= filters.minPrice!);
  if (filters.maxPrice !== undefined) list = list.filter((w) => w.pricing.startingPrice <= filters.maxPrice!);
  if (filters.minRating) list = list.filter((w) => w.rating >= filters.minRating!);
  if (filters.minExperience) list = list.filter((w) => w.experienceYears >= filters.minExperience!);
  if (filters.availableOnly) list = list.filter((w) => w.emergencyAvailable);
  if (filters.maxDistance) {
    list = list.filter((w) => distanceBetween(w, filters.city, filters.area) <= filters.maxDistance!);
  }

  const withDistance = list.map((w) => ({ worker: w, distance: distanceBetween(w, filters.city, filters.area) }));

  switch (filters.sort) {
    case "rating":
      withDistance.sort((a, b) => b.worker.rating - a.worker.rating);
      break;
    case "price_asc":
      withDistance.sort((a, b) => a.worker.pricing.startingPrice - b.worker.pricing.startingPrice);
      break;
    case "price_desc":
      withDistance.sort((a, b) => b.worker.pricing.startingPrice - a.worker.pricing.startingPrice);
      break;
    case "distance":
      withDistance.sort((a, b) => a.distance - b.distance);
      break;
    default:
      withDistance.sort(
        (a, b) =>
          b.worker.rating * 20 + b.worker.completedJobs * 0.05 - (a.worker.rating * 20 + a.worker.completedJobs * 0.05),
      );
  }

  return delay(withDistance, 340);
}

export async function getWorkerById(id: string) {
  const db = getDb();
  const worker = db.workers.find((w) => w.id === id) ?? null;
  const reviews = db.reviews.filter((r) => r.workerId === id);
  const extraReviews = buildStaticReviews(id);
  return delay({ worker, reviews: [...reviews, ...extraReviews] }, 300);
}

function buildStaticReviews(workerId: string): Review[] {
  // Reviews live in the shared dataset; this keeps every worker page populated
  // even when a worker has no linked booking records yet.
  const db = getDb();
  const existing = db.reviews.filter((r) => r.workerId === workerId).length;
  if (existing >= 6) return [];
  const templates = [
    { rating: 5, comment: "Excellent service, very professional and on time. Highly recommended for anyone in the area." },
    { rating: 5, comment: "Did the job neatly and explained everything. Fair pricing and no extra charges." },
    { rating: 4, comment: "Good work overall. Took a little longer than expected but the quality was worth it." },
    { rating: 5, comment: "Second time booking. Consistent service and courteous behaviour every single time." },
    { rating: 5, comment: "Quick response, arrived within 30 minutes of booking. Genuinely impressed." },
    { rating: 4, comment: "Solved the issue quickly. Would have liked a call before the visit but overall happy." },
  ];
  return templates.slice(0, 6 - existing).map((t, i) => ({
    id: `sr_${workerId}_${i}`,
    bookingId: `BKG-${4000 + i}`,
    customerId: `cus_${1 + i}`,
    workerId,
    serviceId: db.workers.find((w) => w.id === workerId)?.serviceIds[0] ?? db.services[0].id,
    rating: t.rating,
    comment: t.comment,
    images: [],
    createdAt: new Date(Date.now() - (i + 2) * 5 * 86400000).toISOString(),
    isHidden: false,
    helpfulCount: 3 + i * 2,
    reply: undefined,
  }));
}

export async function getSimilarWorkers(workerId: string, limit = 4) {
  const db = getDb();
  const worker = db.workers.find((w) => w.id === workerId);
  if (!worker) return delay<Worker[]>([], 220);
  const same = db.workers.filter(
    (w) => w.id !== workerId && w.verification === "APPROVED" && w.categoryId === worker.categoryId,
  );
  const rest = db.workers.filter(
    (w) => w.id !== workerId && w.verification === "APPROVED" && w.categoryId !== worker.categoryId,
  );
  return delay([...same, ...rest].slice(0, limit), 260);
}

export async function getWorkerDashboard(workerId: string) {
  const db = getDb();
  const worker = db.workers.find((w) => w.id === workerId);
  const bookings = db.bookings.filter((b) => b.workerId === workerId);
  const today = todayKey();
  const todayBookings = bookings.filter((b) => b.scheduledDate === today);
  const pending = bookings.filter((b) => b.status === "REQUESTED");
  const active = bookings.filter((b) => ["ACCEPTED", "CONFIRMED", "ON_THE_WAY", "IN_PROGRESS"].includes(b.status));
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const cancelled = bookings.filter((b) => ["CANCELLED", "REJECTED"].includes(b.status));
  const earningsToday = db.transactions
    .filter((t) => t.workerId === workerId && new Date(t.createdAt).toDateString() === today)
    .reduce((sum, t) => sum + t.workerEarning, 0);
  const totalEarnings = db.transactions.filter((t) => t.workerId === workerId).reduce((s, t) => s + t.workerEarning, 0);
  return delay(
    {
      worker,
      todayBookings,
      pending,
      active,
      completed,
      cancelled,
      earningsToday,
      totalEarnings,
      rating: worker?.rating ?? 0,
      series: db.earningsSeries,
    },
    320,
  );
}

export interface WorkerUpdateInput {
  name?: string;
  phone?: string;
  email?: string;
  headline?: string;
  about?: string;
  city?: string;
  area?: string;
  pincode?: string;
  address?: string;
  experienceYears?: number;
  skills?: string[];
  areas?: string[];
  emergencyAvailable?: boolean;
  languages?: string[];
}

export async function updateWorker(workerId: string, updates: WorkerUpdateInput) {
  return mutate((db) => {
    const worker = db.workers.find((w) => w.id === workerId);
    if (!worker) throw new Error("Worker not found");
    Object.assign(worker, updates);
    return delay(worker, 520);
  });
}

export async function updateWorkerPricing(
  workerId: string,
  pricing: { visitCharge: number; startingPrice: number; hourlyPrice: number; minJobAmount: number },
) {
  return mutate((db) => {
    const worker = db.workers.find((w) => w.id === workerId);
    if (!worker) throw new Error("Worker not found");
    worker.pricing = pricing;
    return delay(worker, 520);
  });
}

export async function updateWorkerServices(workerId: string, serviceIds: string[], subcategoryIds: string[]) {
  return mutate((db) => {
    const worker = db.workers.find((w) => w.id === workerId);
    if (!worker) throw new Error("Worker not found");
    worker.serviceIds = serviceIds;
    worker.subcategoryIds = subcategoryIds;
    return delay(worker, 520);
  });
}

export async function updateAvailability(
  workerId: string,
  availability: Worker["availability"],
  blockedDates: string[],
  emergencyAvailable: boolean,
) {
  return mutate((db) => {
    const worker = db.workers.find((w) => w.id === workerId);
    if (!worker) throw new Error("Worker not found");
    worker.availability = availability;
    worker.blockedDates = blockedDates;
    worker.emergencyAvailable = emergencyAvailable;
    return delay(worker, 520);
  });
}

export async function uploadWorkerDocument(
  workerId: string,
  doc: { type: Worker["documents"][number]["type"]; number: string },
) {
  return mutate((db) => {
    const worker = db.workers.find((w) => w.id === workerId);
    if (!worker) throw new Error("Worker not found");
    const existing = worker.documents.findIndex((d) => d.type === doc.type);
    const record = {
      id: makeId("doc"),
      type: doc.type,
      number: doc.number,
      uploadedAt: new Date().toISOString(),
      status: "PENDING" as const,
    };
    if (existing >= 0) worker.documents[existing] = record;
    else worker.documents.push(record);
    return delay(worker.documents, 600);
  });
}

export async function getWorkerEarnings(workerId: string) {
  const db = getDb();
  const transactions = db.transactions
    .filter((t) => t.workerId === workerId)
    .sort(byNewest)
    .map((t) => ({ ...t, booking: db.bookings.find((b) => b.id === t.bookingId) ?? null }));
  const worker = db.workers.find((w) => w.id === workerId);
  const series = db.earningsSeries;
  const total = transactions.reduce((s, t) => s + t.workerEarning, 0);
  const today = todayKey();
  return delay(
    {
      transactions,
      series,
      totals: {
        today: transactions.filter((t) => new Date(t.createdAt).toDateString() === today).reduce((s, t) => s + t.workerEarning, 0),
        week: total,
        month: total,
        total,
        commissionPaid: transactions.reduce((s, t) => s + t.platformFee, 0),
        jobs: transactions.length,
      },
      rating: worker?.rating ?? 0,
      completedJobs: worker?.completedJobs ?? 0,
    },
    340,
  );
}

export async function getWorkerReviews(workerId: string) {
  const db = getDb();
  const rows = [...db.reviews.filter((r) => r.workerId === workerId), ...buildStaticReviews(workerId)].sort(byNewest);
  const reviews = rows.map((r) => {
    const booking = db.bookings.find((b) => b.id === r.bookingId) ?? null;
    return {
      ...r,
      customer: db.customers.find((c) => c.id === r.customerId) ?? null,
      service: db.services.find((s) => s.id === r.serviceId) ?? null,
      isVerifiedPurchase: Boolean(booking && booking.status === "COMPLETED"),
    };
  });
  const worker = db.workers.find((w) => w.id === workerId);
  return delay(
    { reviews, breakdown: worker?.ratingBreakdown ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, worker },
    300,
  );
}

export async function submitWorkerVerification(workerId: string) {
  return mutate((db) => {
    const worker = db.workers.find((w) => w.id === workerId);
    if (!worker) throw new Error("Worker not found");
    worker.verification = "PENDING";
    worker.rejectionReason = undefined;
    return delay(worker, 700);
  });
}

export const bookingStatusLabel: Record<BookingStatus, string> = {
  REQUESTED: "Requested",
  ACCEPTED: "Accepted",
  CONFIRMED: "Confirmed",
  ON_THE_WAY: "On the way",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};
