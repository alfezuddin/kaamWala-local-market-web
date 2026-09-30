import { byNewest, delay, makeId } from "@/lib/api";
import { getDb, mutate } from "@/mock/db";
import type { Review } from "@/types";

export async function getReviews(filters: { customerId?: string; workerId?: string; serviceId?: string; minRating?: number; search?: string; includeHidden?: boolean } = {}) {
  const db = getDb();
  let list = [...db.reviews];
  if (!filters.includeHidden) list = list.filter((r) => !r.isHidden);
  if (filters.customerId) list = list.filter((r) => r.customerId === filters.customerId);
  if (filters.workerId) list = list.filter((r) => r.workerId === filters.workerId);
  if (filters.serviceId) list = list.filter((r) => r.serviceId === filters.serviceId);
  if (filters.minRating) list = list.filter((r) => r.rating === filters.minRating);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((r) => r.comment.toLowerCase().includes(q));
  }
  list.sort(byNewest);
  return delay(
    list.map((r) => ({
      ...r,
      customer: db.customers.find((c) => c.id === r.customerId) ?? null,
      worker: db.workers.find((w) => w.id === r.workerId) ?? null,
      service: db.services.find((s) => s.id === r.serviceId) ?? null,
    })),
    300,
  );
}

export async function getCustomerReviews(customerId: string) {
  const db = getDb();
  const submitted = db.reviews
    .filter((r) => r.customerId === customerId)
    .sort(byNewest)
    .map((r) => ({
      ...r,
      worker: db.workers.find((w) => w.id === r.workerId) ?? null,
      service: db.services.find((s) => s.id === r.serviceId) ?? null,
    }));
  const pending = db.bookings
    .filter((b) => b.customerId === customerId && b.status === "COMPLETED" && !db.reviews.some((r) => r.bookingId === b.id))
    .map((b) => ({
      ...b,
      worker: db.workers.find((w) => w.id === b.workerId) ?? null,
      service: db.services.find((s) => s.id === b.serviceId) ?? null,
    }));
  return delay({ submitted, pending }, 300);
}

export async function submitReview(input: {
  bookingId: string;
  customerId: string;
  workerId: string;
  serviceId: string;
  rating: number;
  comment: string;
  images?: string[];
}) {
  return mutate((db) => {
    const review: Review = {
      id: makeId("REV"),
      bookingId: input.bookingId,
      customerId: input.customerId,
      workerId: input.workerId,
      serviceId: input.serviceId,
      rating: input.rating,
      comment: input.comment,
      images: input.images ?? [],
      createdAt: new Date().toISOString(),
      isHidden: false,
      helpfulCount: 0,
    };
    db.reviews.unshift(review);

    const worker = db.workers.find((w) => w.id === input.workerId);
    if (worker) {
      const total = worker.reviewCount + 1;
      worker.rating = Number(((worker.rating * worker.reviewCount + input.rating) / total).toFixed(2));
      worker.reviewCount = total;
      const pct = (worker.ratingBreakdown[input.rating as 1 | 2 | 3 | 4 | 5] ?? 0) + 3;
      worker.ratingBreakdown[input.rating as 1 | 2 | 3 | 4 | 5] = Math.min(100, Math.round(pct));
    }
    const booking = db.bookings.find((b) => b.id === input.bookingId);
    if (booking) booking.rating = input.rating;
    return delay(review, 650);
  });
}

export async function replyToReview(reviewId: string, reply: string) {
  return mutate((db) => {
    const review = db.reviews.find((r) => r.id === reviewId);
    if (!review) throw new Error("Review not found");
    review.reply = reply;
    return delay(review, 520);
  });
}

export async function setReviewVisibility(reviewId: string, hidden: boolean) {
  return mutate((db) => {
    const review = db.reviews.find((r) => r.id === reviewId);
    if (!review) throw new Error("Review not found");
    review.isHidden = hidden;
    return delay(review, 480);
  });
}

export async function markReviewHelpful(reviewId: string) {
  return mutate((db) => {
    const review = db.reviews.find((r) => r.id === reviewId);
    if (!review) throw new Error("Review not found");
    review.helpfulCount += 1;
    return delay(review, 260);
  });
}
