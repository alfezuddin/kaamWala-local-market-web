import { byNewest, delay } from "@/lib/api";
import { getDb } from "@/mock/db";
import type { Customer } from "@/types";

export async function getCustomers() {
  const db = getDb();
  return delay([...db.customers].sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt)), 280);
}

export async function getCustomerById(id: string) {
  const db = getDb();
  const customer = (db.customers.find((c) => c.id === id) ?? null) as Customer | null;
  if (!customer) return delay(null, 240);
  const bookings = db.bookings.filter((b) => b.customerId === id).sort(byNewest);
  return delay(
    {
      customer,
      bookings: bookings.map((b) => ({
        ...b,
        worker: db.workers.find((w) => w.id === b.workerId) ?? null,
        service: db.services.find((s) => s.id === b.serviceId) ?? null,
      })),
      transactions: db.transactions.filter((t) => t.customerId === id).sort(byNewest),
      complaints: db.complaints.filter((c) => c.customerId === id),
    },
    300,
  );
}

export async function getCustomerProfile(id: string) {
  const db = getDb();
  const customer = db.customers.find((c) => c.id === id) ?? null;
  return delay(customer, 240);
}

export async function getCustomerAddresses(customerId: string) {
  const db = getDb();
  const customer = db.customers.find((c) => c.id === customerId);
  return delay(customer?.savedAddresses ?? [], 220);
}
