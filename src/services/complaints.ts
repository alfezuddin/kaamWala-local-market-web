import { byNewest, delay, makeId } from "@/lib/api";
import { getDb, mutate } from "@/mock/db";
import type { Complaint, ComplaintReason, ComplaintStatus } from "@/types";

export async function getComplaints(filters: { customerId?: string; workerId?: string; status?: ComplaintStatus | "ALL"; search?: string } = {}) {
  const db = getDb();
  let list = [...db.complaints];
  if (filters.customerId) list = list.filter((c) => c.customerId === filters.customerId);
  if (filters.workerId) list = list.filter((c) => c.workerId === filters.workerId);
  if (filters.status && filters.status !== "ALL") list = list.filter((c) => c.status === filters.status);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (c) => c.id.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q) || c.bookingId.toLowerCase().includes(q),
    );
  }
  list.sort(byNewest);
  return delay(
    list.map((c) => ({
      ...c,
      customer: db.customers.find((x) => x.id === c.customerId) ?? null,
      worker: db.workers.find((w) => w.id === c.workerId) ?? null,
      booking: db.bookings.find((b) => b.id === c.bookingId) ?? null,
    })),
    300,
  );
}

export async function getComplaintById(id: string) {
  const db = getDb();
  const c = db.complaints.find((x) => x.id === id) ?? null;
  if (!c) return delay(null, 240);
  const booking = db.bookings.find((b) => b.id === c.bookingId) ?? null;
  return delay(
    {
      ...c,
      customer: db.customers.find((x) => x.id === c.customerId) ?? null,
      worker: db.workers.find((w) => w.id === c.workerId) ?? null,
      booking,
      payment: booking ? (db.transactions.find((t) => t.bookingId === booking.id) ?? null) : null,
      service: booking ? (db.services.find((s) => s.id === booking.serviceId) ?? null) : null,
    },
    240,
  );
}

export async function createComplaint(input: {
  bookingId: string;
  customerId: string;
  workerId: string;
  reason: ComplaintReason;
  subject: string;
  statement: string;
  attachments?: string[];
}) {
  return mutate((db) => {
    const complaint: Complaint = {
      id: `CMP-${Date.now().toString().slice(-5)}`,
      bookingId: input.bookingId,
      customerId: input.customerId,
      workerId: input.workerId,
      reason: input.reason,
      subject: input.subject,
      customerStatement: input.statement,
      workerStatement: "",
      status: "OPEN",
      createdAt: new Date().toISOString(),
      adminNotes: [],
      attachments: input.attachments ?? [],
    };
    db.complaints.unshift(complaint);
    const booking = db.bookings.find((b) => b.id === input.bookingId);
    if (booking) {
      db.notifications.unshift({
        id: makeId("ntf"),
        userId: booking.customerId,
        category: "BOOKING",
        title: `Complaint ${complaint.id} registered`,
        body: "Our support team will reach out within 24 hours.",
        createdAt: new Date().toISOString(),
        isRead: false,
        href: `/customer/bookings/${booking.id}`,
      });
    }
    return delay(complaint, 700);
  });
}

export async function respondToComplaint(complaintId: string, statement: string) {
  return mutate((db) => {
    const c = db.complaints.find((x) => x.id === complaintId);
    if (!c) throw new Error("Complaint not found");
    c.workerStatement = statement;
    return delay(c, 560);
  });
}

export async function updateComplaintStatus(complaintId: string, status: ComplaintStatus, resolution?: string) {
  return mutate((db) => {
    const c = db.complaints.find((x) => x.id === complaintId);
    if (!c) throw new Error("Complaint not found");
    c.status = status;
    if (status === "RESOLVED" || status === "REJECTED") {
      c.resolvedAt = new Date().toISOString();
      c.resolution = resolution;
    }
    return delay(c, 560);
  });
}

export async function addComplaintNote(complaintId: string, note: string) {
  return mutate((db) => {
    const c = db.complaints.find((x) => x.id === complaintId);
    if (!c) throw new Error("Complaint not found");
    c.adminNotes.push({ id: makeId("note"), note, createdAt: new Date().toISOString() });
    return delay(c, 480);
  });
}

export const COMPLAINT_REASON_LABELS: Record<ComplaintReason, string> = {
  QUALITY_ISSUE: "Poor quality of work",
  NO_SHOW: "Worker did not show up",
  OVERCHARGE: "Overcharged for the job",
  UNPROFESSIONAL: "Unprofessional behaviour",
  DAMAGE: "Property damage",
  OTHER: "Other",
};
