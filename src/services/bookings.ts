import { byNewest, delay, makeId } from "@/lib/api";
import { getDb, mutate } from "@/mock/db";
import type { Booking, BookingStatus, Transaction } from "@/types";
import type { CreateBookingInput } from "./workers";

export type { CreateBookingInput };

export const ACTIVE_STATUSES: BookingStatus[] = ["REQUESTED", "ACCEPTED", "CONFIRMED", "ON_THE_WAY", "IN_PROGRESS"];

export interface BookingFilters {
  customerId?: string;
  workerId?: string;
  status?: BookingStatus | "ALL";
  search?: string;
  from?: string;
  to?: string;
  categoryId?: string;
  paymentStatus?: string;
}

function applyFilters(bookings: Booking[], filters: BookingFilters) {
  const db = getDb();
  let list = [...bookings];
  if (filters.customerId) list = list.filter((b) => b.customerId === filters.customerId);
  if (filters.workerId) list = list.filter((b) => b.workerId === filters.workerId);
  if (filters.status && filters.status !== "ALL") list = list.filter((b) => b.status === filters.status);
  if (filters.categoryId) list = list.filter((b) => b.categoryId === filters.categoryId);
  if (filters.paymentStatus) list = list.filter((b) => b.paymentStatus === filters.paymentStatus);
  if (filters.from) list = list.filter((b) => b.scheduledDate >= filters.from!);
  if (filters.to) list = list.filter((b) => b.scheduledDate <= filters.to!);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((b) => {
      const worker = db.workers.find((w) => w.id === b.workerId);
      const customer = db.customers.find((c) => c.id === b.customerId);
      const service = db.services.find((s) => s.id === b.serviceId);
      return (
        b.id.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        (worker?.name.toLowerCase().includes(q) ?? false) ||
        (customer?.name.toLowerCase().includes(q) ?? false) ||
        (service?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }
  return list.sort(byNewest);
}

export async function getBookings(filters: BookingFilters = {}) {
  const db = getDb();
  const list = applyFilters(db.bookings, filters);
  return delay(
    list.map((b) => ({
      ...b,
      worker: db.workers.find((w) => w.id === b.workerId) ?? null,
      customer: db.customers.find((c) => c.id === b.customerId) ?? null,
      service: db.services.find((s) => s.id === b.serviceId) ?? null,
    })),
    320,
  );
}

export async function getBookingById(id: string) {
  const db = getDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) return delay(null, 260);
  return delay(
    {
      ...booking,
      worker: db.workers.find((w) => w.id === booking.workerId) ?? null,
      customer: db.customers.find((c) => c.id === booking.customerId) ?? null,
      service: db.services.find((s) => s.id === booking.serviceId) ?? null,
      category: db.categories.find((c) => c.id === booking.categoryId) ?? null,
      transaction: db.transactions.find((t) => t.bookingId === booking.id) ?? null,
      review: db.reviews.find((r) => r.bookingId === booking.id) ?? null,
      complaint: db.complaints.find((c) => c.bookingId === booking.id) ?? null,
    },
    260,
  );
}

export async function createBooking(input: CreateBookingInput) {
  return mutate((db) => {
    const worker = db.workers.find((w) => w.id === input.workerId);
    if (!worker) throw new Error("Selected worker is no longer available");
    const price = Math.max(worker.pricing.startingPrice, worker.pricing.minJobAmount) + worker.pricing.visitCharge;
    const booking: Booking = {
      id: `BKG-${Date.now().toString().slice(-6)}`,
      customerId: input.customerId,
      workerId: input.workerId,
      serviceId: input.serviceId,
      categoryId: db.services.find((s) => s.id === input.serviceId)?.categoryId ?? worker.categoryId,
      title: input.title,
      description: input.description,
      notes: input.notes,
      images: input.images,
      address: input.address,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      isFlexible: input.isFlexible,
      status: "REQUESTED",
      price,
      visitCharge: worker.pricing.visitCharge,
      platformFee: Math.round((price * 10) / 100),
      paymentStatus: input.paymentMethod === "CASH" ? "PENDING" : "PENDING",
      paymentMethod: input.paymentMethod,
      timeline: [{ status: "REQUESTED", at: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    db.bookings.unshift(booking);

    db.notifications.unshift({
      id: makeId("ntf"),
      userId: worker.id,
      category: "BOOKING",
      title: `New booking request ${booking.id}`,
      body: `${booking.title} · ${booking.address.area}, ${booking.address.city}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      href: `/worker/jobs/${booking.id}`,
    });
    return delay(booking, 780);
  });
}

function setStatus(booking: Booking, status: BookingStatus, note?: string) {
  booking.status = status;
  booking.timeline.push({ status, at: new Date().toISOString(), note });
}

export async function acceptBooking(id: string) {
  return mutate((db) => {
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    setStatus(booking, "ACCEPTED", "Accepted by the worker");
    db.notifications.unshift({
      id: makeId("ntf"),
      userId: booking.customerId,
      category: "BOOKING",
      title: `Booking ${booking.id} accepted`,
      body: "Your worker accepted the request. You will get a confirmation shortly.",
      createdAt: new Date().toISOString(),
      isRead: false,
      href: `/customer/bookings/${booking.id}`,
    });
    return delay(booking, 620);
  });
}

export async function confirmBooking(id: string) {
  return mutate((db) => {
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    setStatus(booking, "CONFIRMED", "Confirmed by the customer");
    return delay(booking, 520);
  });
}

export async function rejectBooking(id: string, reason: string) {
  return mutate((db) => {
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    setStatus(booking, "REJECTED", reason);
    booking.cancelReason = reason;
    booking.paymentStatus = "REFUNDED";
    db.notifications.unshift({
      id: makeId("ntf"),
      userId: booking.customerId,
      category: "BOOKING",
      title: `Booking ${booking.id} could not be served`,
      body: reason,
      createdAt: new Date().toISOString(),
      isRead: false,
      href: `/customer/bookings/${booking.id}`,
    });
    return delay(booking, 600);
  });
}

export async function cancelBooking(id: string, reason: string) {
  return mutate((db) => {
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    setStatus(booking, "CANCELLED", reason);
    booking.cancelReason = reason;
    booking.paymentStatus = booking.paymentStatus === "PAID" ? "REFUNDED" : "PENDING";
    return delay(booking, 600);
  });
}

export async function startJob(id: string) {
  return mutate((db) => {
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    setStatus(booking, "IN_PROGRESS", "Work started on site");
    return delay(booking, 520);
  });
}

export async function markOnTheWay(id: string, etaMinutes: number) {
  return mutate((db) => {
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    setStatus(booking, "ON_THE_WAY", `Estimated arrival in ${etaMinutes} minutes`);
    booking.workerEta = etaMinutes;
    return delay(booking, 480);
  });
}

export async function completeBooking(id: string, note?: string) {
  return mutate((db) => {
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    const summary = note?.trim() ? note.trim() : undefined;
    setStatus(booking, "COMPLETED", summary ?? "Job completed");
    if (summary) booking.completionNote = summary;
    booking.paymentStatus = booking.paymentMethod === "CASH" ? "PAID" : "PAID";
    if (booking.workerId) {
      const worker = db.workers.find((w) => w.id === booking.workerId);
      if (worker) worker.completedJobs += 1;
      db.transactions.unshift({
        id: `TXN-${makeId("").slice(1, 8)}`,
        bookingId: booking.id,
        customerId: booking.customerId,
        workerId: booking.workerId,
        amount: booking.price + booking.platformFee,
        platformFee: booking.platformFee,
        workerEarning: booking.price,
        method: booking.paymentMethod,
        status: "PAID",
        createdAt: new Date().toISOString(),
        reference: `KW${Math.floor(10000000 + Math.random() * 89999999)}`,
        invoiceNo: `INV-2024-${Math.floor(1000 + Math.random() * 8999)}`,
      });
    }
    return delay(booking, 640);
  });
}

export async function rescheduleBooking(id: string, date: string, time: string) {
  return mutate((db) => {
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    booking.scheduledDate = date;
    booking.scheduledTime = time;
    booking.timeline.push({ status: booking.status, at: new Date().toISOString(), note: `Rescheduled to ${date} at ${time}` });
    return delay(booking, 560);
  });
}

export async function getCustomerBookings(customerId: string) {
  const db = getDb();
  const bookings = db.bookings.filter((b) => b.customerId === customerId).sort(byNewest);
  const totalSpent = bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((s, b) => s + b.price, 0);
  return delay(
    {
      bookings: bookings.map((b) => ({
        ...b,
        worker: db.workers.find((w) => w.id === b.workerId) ?? null,
        service: db.services.find((s) => s.id === b.serviceId) ?? null,
        review: db.reviews.find((r) => r.bookingId === b.id) ?? null,
      })),
      stats: {
        active: bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length,
        upcoming: bookings.filter((b) => ["ACCEPTED", "CONFIRMED", "ON_THE_WAY"].includes(b.status)).length,
        completed: bookings.filter((b) => b.status === "COMPLETED").length,
        totalSpent,
      },
    },
    320,
  );
}

export async function getCustomerDashboard(customerId: string) {
  const db = getDb();
  const bookings = db.bookings.filter((b) => b.customerId === customerId);
  const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const today = new Date().toISOString().slice(0, 10);
  return delay(
    {
      customer: db.customers.find((c) => c.id === customerId) ?? null,
      stats: {
        active: active.length,
        upcoming: bookings.filter((b) => b.scheduledDate >= today && ACTIVE_STATUSES.includes(b.status)).length,
        completed: completed.length,
        totalSpent: completed.reduce((s, b) => s + b.price, 0),
      },
      recommended: db.services.filter((s) => s.isActive).sort((a, b) => b.rating - a.rating).slice(0, 6),
      nearby: db.workers
        .filter((w) => w.verification === "APPROVED" && w.status === "ACTIVE")
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4),
      recent: bookings.slice(0, 5).map((b) => ({
        ...b,
        worker: db.workers.find((w) => w.id === b.workerId) ?? null,
        service: db.services.find((s) => s.id === b.serviceId) ?? null,
      })),
    },
    360,
  );
}

export async function getAdminBookings(filters: BookingFilters = {}) {
  const db = getDb();
  const list = applyFilters(db.bookings, filters);
  return delay(
    list.map((b) => ({
      ...b,
      worker: db.workers.find((w) => w.id === b.workerId) ?? null,
      customer: db.customers.find((c) => c.id === b.customerId) ?? null,
      service: db.services.find((s) => s.id === b.serviceId) ?? null,
    })),
    340,
  );
}

export async function getAdminBookingStats() {
  const db = getDb();
  const bookings = db.bookings;
  return delay(
    {
      total: bookings.length,
      completed: bookings.filter((b) => b.status === "COMPLETED").length,
      cancelled: bookings.filter((b) => ["CANCELLED", "REJECTED"].includes(b.status)).length,
      active: bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length,
      revenue: bookings.filter((b) => b.paymentStatus === "PAID").reduce((s, b) => s + b.platformFee, 0),
      gmv: bookings.filter((b) => b.paymentStatus === "PAID").reduce((s, b) => s + b.price, 0),
    },
    240,
  );
}

export { getDb };
export type { Transaction };
