import { byNewest, delay, makeId } from "@/lib/api";
import { getDb, mutate } from "@/mock/db";
import type { PaymentMethod, Transaction } from "@/types";

export interface PaymentFilters {
  customerId?: string;
  workerId?: string;
  status?: string;
  method?: PaymentMethod | "ALL";
  search?: string;
}

export async function getTransactions(filters: PaymentFilters = {}) {
  const db = getDb();
  let list = [...db.transactions];
  if (filters.customerId) list = list.filter((t) => t.customerId === filters.customerId);
  if (filters.workerId) list = list.filter((t) => t.workerId === filters.workerId);
  if (filters.status && filters.status !== "ALL") list = list.filter((t) => t.status === filters.status);
  if (filters.method && filters.method !== "ALL") list = list.filter((t) => t.method === filters.method);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((t) => {
      const customer = db.customers.find((c) => c.id === t.customerId);
      const worker = db.workers.find((w) => w.id === t.workerId);
      return (
        t.id.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.invoiceNo.toLowerCase().includes(q) ||
        t.bookingId.toLowerCase().includes(q) ||
        (customer?.name.toLowerCase().includes(q) ?? false) ||
        (worker?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }
  list.sort(byNewest);
  return delay(
    list.map((t) => ({
      ...t,
      customer: db.customers.find((c) => c.id === t.customerId) ?? null,
      worker: db.workers.find((w) => w.id === t.workerId) ?? null,
      booking: db.bookings.find((b) => b.id === t.bookingId) ?? null,
    })),
    320,
  );
}

export async function getTransactionById(id: string) {
  const db = getDb();
  const t = db.transactions.find((x) => x.id === id) ?? null;
  if (!t) return delay(null, 240);
  return delay(
    {
      ...t,
      customer: db.customers.find((c) => c.id === t.customerId) ?? null,
      worker: db.workers.find((w) => w.id === t.workerId) ?? null,
      booking: db.bookings.find((b) => b.id === t.bookingId) ?? null,
    },
    240,
  );
}

export async function getPaymentSummary(filters: PaymentFilters = {}) {
  const list = await getTransactions(filters);
  const total = list.reduce((s, t) => s + t.amount, 0);
  const fees = list.reduce((s, t) => s + t.platformFee, 0);
  const earnings = list.reduce((s, t) => s + t.workerEarning, 0);
  const byMethod = (["UPI", "CARD", "CASH", "WALLET"] as PaymentMethod[]).map((method) => ({
    method,
    value: list.filter((t) => t.method === method).length,
    amount: list.filter((t) => t.method === method).reduce((s, t) => s + t.amount, 0),
  }));
  return { total, fees, earnings, count: list.length, byMethod, transactions: list };
}

export async function getWalletBalance(userId: string) {
  const db = getDb();
  const spent = db.transactions.filter((t) => t.customerId === userId && t.method === "WALLET").length;
  return delay({ balance: 2400 - spent * 320, currency: "INR" }, 200);
}

export async function payBooking(bookingId: string, method: PaymentMethod) {
  return mutate((db) => {
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");
    booking.paymentStatus = "PAID";
    booking.paymentMethod = method;
    if (!db.transactions.some((t) => t.bookingId === bookingId)) {
      const fee = booking.platformFee;
      const serviceTotal = booking.price + booking.visitCharge;
      db.transactions.unshift({
        id: makeId("txn"),
        bookingId,
        customerId: booking.customerId,
        workerId: booking.workerId ?? "",
        amount: serviceTotal + fee,
        platformFee: fee,
        workerEarning: serviceTotal,
        method,
        status: "PAID",
        createdAt: new Date().toISOString(),
        reference: `KW${Math.floor(100000 + Math.random() * 899999)}`,
        invoiceNo: `INV-${new Date().getFullYear()}-${String(bookingId).replace(/\D/g, "")}`,
      });
    }
    return delay(booking, 700);
  });
}

export type { Transaction };
