"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  IndianRupee,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldAlert,
  Star,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { Separator } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { BookingTimeline } from "@/components/ui/booking-card";
import { RatingInput } from "@/components/ui/rating-stars";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useAuth } from "@/components/providers/auth-provider";
import { useDbVersion } from "@/hooks/use-mounted";
import {
  cancelBooking,
  completeBooking,
  rescheduleBooking,
  getBookingById,
} from "@/services/bookings";
import { createComplaint } from "@/services/complaints";
import { payBooking } from "@/services/payments";
import { submitReview } from "@/services/reviews";
import { startConversation } from "@/services/chat";
import { formatDate, formatDateTime, formatINR, formatTimeAgo } from "@/lib/format";
import { addDaysISO, todayKey } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { Booking, Complaint, PaymentMethod, Review, Transaction, Worker, Service, ServiceCategory, Customer } from "@/types";

type BookingDetail = {
  worker: Worker | null;
  customer: Customer | null;
  service: Service | null;
  category: ServiceCategory | null;
  transaction: Transaction | null;
  review: Review | null;
  complaint: Complaint | null;
};

const CANCEL_REASONS = [
  "Found someone else",
  "Issue resolved on its own",
  "Rescheduling for later",
  "Worker did not show up",
  "Service quality was not satisfactory",
  "Other",
];

export function BookingDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { session } = useAuth();
  const dbVersion = useDbVersion();

  const query = useApiQuery(["booking", id, dbVersion], () => getBookingById(id));

  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState(CANCEL_REASONS[0]);
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [newDate, setNewDate] = React.useState(addDaysISO(1));
  const [complaintOpen, setComplaintOpen] = React.useState(false);
  const [complaintText, setComplaintText] = React.useState("");
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewText, setReviewText] = React.useState("");

  const cancelMutation = useApiMutation((vars: { id: string; reason: string }) =>
    cancelBooking(vars.id, vars.reason),
  );
  const rescheduleMutation = useApiMutation((vars: { id: string; date: string }) =>
    rescheduleBooking(vars.id, vars.date, "10:00"),
  );
  const payMutation = useApiMutation((vars: { id: string; method: PaymentMethod }) =>
    payBooking(vars.id, vars.method),
  );
  const completeMutation = useApiMutation((vars: { id: string }) => completeBooking(vars.id));
  const complaintMutation = useApiMutation((vars: { bookingId: string; text: string }) =>
    createComplaint({
      bookingId: vars.bookingId,
      customerId: session?.userId ?? "",
      workerId: query.data?.workerId ?? "",
      subject: "Service quality issue",
      statement: vars.text,
      reason: "QUALITY_ISSUE",
    }),
  );
  const reviewMutation = useApiMutation((vars: { bookingId: string; rating: number; text: string }) =>
    submitReview({
      bookingId: vars.bookingId,
      customerId: session?.userId ?? "",
      workerId: query.data?.workerId ?? "",
      serviceId: query.data?.serviceId ?? "",
      rating: vars.rating,
      comment: vars.text,
    }),
  );

  if (query.isLoading) return <SectionLoader label="Loading booking…" />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  const detail = query.data as (Booking & BookingDetail) | null;
  if (!detail) return null;

  const total = detail.price + detail.visitCharge + detail.platformFee;
  const isOpen = ["REQUESTED", "ACCEPTED", "CONFIRMED", "ON_THE_WAY", "IN_PROGRESS"].includes(detail.status);
  const isCompleted = detail.status === "COMPLETED";
  const canPay = detail.paymentStatus === "PENDING" || detail.paymentStatus === "FAILED";
  const canReview = isCompleted && !detail.review;
  const canComplain = detail.status !== "REQUESTED" && !detail.complaint;

  const refresh = () => {
    query.refetch();
    router.refresh();
  };

  const onCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ id, reason: cancelReason });
      setCancelOpen(false);
      toast.success("Booking cancelled", "Any advance payment is refunded within 3 working days.");
      refresh();
    } catch (error) {
      toast.error("Could not cancel", error instanceof Error ? error.message : undefined);
    }
  };

  const onReschedule = async () => {
    try {
      await rescheduleMutation.mutateAsync({ id, date: newDate });
      setRescheduleOpen(false);
      toast.success("Rescheduled", `Moved to ${formatDate(newDate)}. The worker has been notified.`);
      refresh();
    } catch (error) {
      toast.error("Could not reschedule", error instanceof Error ? error.message : undefined);
    }
  };

  const onPay = async (method: PaymentMethod) => {
    try {
      await payMutation.mutateAsync({ id, method });
      toast.success("Payment successful", `Paid ${formatINR(total)} via ${method.toLowerCase()}.`);
      refresh();
    } catch (error) {
      toast.error("Payment failed", error instanceof Error ? error.message : undefined);
    }
  };

  const onComplete = async () => {
    try {
      await completeMutation.mutateAsync({ id });
      toast.success("Job marked complete", "You can now rate the service and release payment.");
      refresh();
    } catch (error) {
      toast.error("Could not complete", error instanceof Error ? error.message : undefined);
    }
  };

  const onComplaint = async () => {
    if (complaintText.trim().length < 10) {
      toast.warning("Add more detail", "Please describe the issue in at least 10 characters.");
      return;
    }
    try {
      await complaintMutation.mutateAsync({ bookingId: id, text: complaintText.trim() });
      setComplaintOpen(false);
      setComplaintText("");
      toast.success("Complaint raised", "Our support team will respond within 24 hours.");
      refresh();
    } catch (error) {
      toast.error("Could not raise complaint", error instanceof Error ? error.message : undefined);
    }
  };

  const onReview = async () => {
    if (reviewText.trim().length < 5) {
      toast.warning("Add a little more", "Please write at least 5 characters.");
      return;
    }
    try {
      await reviewMutation.mutateAsync({ bookingId: id, rating: reviewRating, text: reviewText.trim() });
      setReviewOpen(false);
      toast.success("Thanks for your review!", "It helps other customers choose confidently.");
      refresh();
    } catch (error) {
      toast.error("Could not submit review", error instanceof Error ? error.message : undefined);
    }
  };

  const openChat = async () => {
    if (!detail.workerId) return;
    try {
      const conversation = await startConversation(session?.userId ?? "", detail.workerId, id);
      router.push(`/customer/chat?conversation=${conversation.id}`);
    } catch (error) {
      toast.error("Could not open chat", error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.title}
        description={`Booking ${detail.id} · created ${formatTimeAgo(detail.createdAt)}`}
        breadcrumbs={[
          { label: "Customer", href: "/customer/dashboard" },
          { label: "Bookings", href: "/customer/bookings" },
          { label: detail.id },
        ]}
        actions={
          <Button variant="ghost" size="sm" icon={<ArrowLeft />} onClick={() => router.push("/customer/bookings")}>
            Back
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Progress</CardTitle>
              <StatusBadge status={detail.status} />
            </CardHeader>
            <CardContent>
              <BookingTimeline timeline={detail.timeline} />
              {detail.completionNote && (
                <div className="bg-success/8 border-success/30 mt-4 rounded-lg border p-3">
                  <p className="text-success text-xs font-medium uppercase">Work summary</p>
                  <p className="mt-1 text-sm leading-relaxed">{detail.completionNote}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">{detail.description}</p>
              {detail.notes && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase">Your notes</p>
                  <p className="mt-1 text-sm">{detail.notes}</p>
                </div>
              )}
              <Separator />
              <dl className="grid gap-3 sm:grid-cols-2">
                <Row label="Service" value={detail.service?.name ?? "—"} />
                <Row label="Category" value={detail.category?.name ?? "—"} />
                <Row
                  label="Scheduled"
                  value={`${formatDate(detail.scheduledDate)} at ${detail.scheduledTime}`}
                  icon={<CalendarClock className="size-4" />}
                />
                <Row
                  label="Address"
                  value={`${detail.address.line1}, ${detail.address.area}, ${detail.address.city} ${detail.address.pincode}`}
                  icon={<MapPin className="size-4" />}
                />
                <Row label="Flexible timing" value={detail.isFlexible ? "Yes, any time that day" : "No, exact slot"} />
                <Row label="Payment" value={detail.paymentStatus.charAt(0) + detail.paymentStatus.slice(1).toLowerCase()} />
              </dl>
            </CardContent>
          </Card>

          {detail.transaction && (
            <Card>
              <CardHeader>
                <CardTitle>Payment receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Row label="Transaction ID" value={detail.transaction.id} />
                  <Row label="Method" value={detail.transaction.method} />
                  <Row label="Paid on" value={formatDateTime(detail.transaction.createdAt)} />
                  <Row label="Status" value={detail.transaction.status} />
                  <Row label="Service amount" value={formatINR(detail.price)} />
                  <Row label="Platform fee" value={formatINR(detail.platformFee)} />
                </dl>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-bold">{formatINR(total)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {detail.review && (
            <Card>
              <CardHeader>
                <CardTitle>Your review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Star className="text-warning size-4 fill-warning" />
                  <span className="text-sm font-semibold">{detail.review.rating}.0</span>
                </div>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{detail.review.comment}</p>
              </CardContent>
            </Card>
          )}

          {detail.complaint && (
            <Card className="border-warning/40">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Complaint</CardTitle>
                <Badge variant={detail.complaint.status === "RESOLVED" ? "success" : "warning"}>
                  {detail.complaint.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{detail.complaint.customerStatement}</p>
                {detail.complaint.resolution && (
                  <p className="bg-muted/50 mt-3 rounded-lg p-3 text-[13px]">
                    <span className="font-medium">Resolution:</span> {detail.complaint.resolution}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          {detail.worker ? (
            <Card>
              <CardHeader>
                <CardTitle>Assigned professional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href={`/workers/${detail.worker.id}`} className="hover:bg-accent/60 -mx-2 flex items-center gap-3 rounded-lg p-2">
                  <AvatarCircle name={detail.worker.name} size="lg" online={detail.worker.isOnline} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{detail.worker.name}</p>
                    <p className="text-muted-foreground text-[13px]">{detail.worker.headline}</p>
                    <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[13px]">
                      <Star className="text-warning size-3.5 fill-warning" />
                      {detail.worker.rating.toFixed(1)} · {detail.worker.completedJobs} jobs
                    </p>
                  </div>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={openChat} icon={<MessageCircle />}>
                    Chat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Calling…", `Connecting you to ${detail.worker!.name} at ${detail.worker!.phone}.`)}
                    icon={<Phone />}
                  >
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="bg-muted text-muted-foreground mx-auto flex size-12 items-center justify-center rounded-full">
                  <CalendarClock className="size-6" />
                </div>
                <p className="mt-3 text-sm font-medium">Finding a professional</p>
                <p className="text-muted-foreground mt-1 text-[13px]">
                  We are matching you with a verified worker for your trade.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canPay && (
                <div className="space-y-2">
                  <Label>Pay {formatINR(total)}</Label>
                  {PAYMENT_METHODS.map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      loading={payMutation.isPending}
                      onClick={() => onPay(option.value as PaymentMethod)}
                      icon={<IndianRupee />}
                    >
                      {option.label} – {option.description}
                    </Button>
                  ))}
                </div>
              )}
              {isOpen && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    icon={<RefreshCw />}
                    onClick={() => setRescheduleOpen(true)}
                  >
                    Reschedule visit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    icon={<XCircle />}
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel booking
                  </Button>
                </>
              )}
              {detail.status === "IN_PROGRESS" && (
                <Button size="sm" className="w-full" icon={<CheckCircle2 />} onClick={onComplete} loading={completeMutation.isPending}>
                  Mark job complete
                </Button>
              )}
              {isCompleted && canReview && (
                <Button size="sm" className="w-full" icon={<Star />} onClick={() => setReviewOpen(true)}>
                  Rate this service
                </Button>
              )}
              {canComplain && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  icon={<ShieldAlert />}
                  onClick={() => setComplaintOpen(true)}
                >
                  Raise a complaint
                </Button>
              )}
              <Button variant="ghost" size="sm" className="w-full justify-start" icon={<MessageCircle />} onClick={openChat}>
                Get help in chat
              </Button>
              {!canPay && !isOpen && !isCompleted && (
                <p className="text-muted-foreground px-1 text-[13px]">
                  This booking is {detail.status.toLowerCase()}. No further action is needed right now.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span>{formatINR(detail.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visit charge</span>
                <span>{formatINR(detail.visitCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee</span>
                <span>{formatINR(detail.platformFee)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this booking?"
        description="The worker will be notified. Any advance payment is refunded within 3 working days."
        confirmLabel="Cancel booking"
        variant="destructive"
        loading={cancelMutation.isPending}
        onConfirm={onCancel}
      >
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Reason</Label>
          <div className="space-y-1.5">
            {CANCEL_REASONS.map((reason) => (
              <label key={reason} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="cancel-reason"
                  value={reason}
                  checked={cancelReason === reason}
                  onChange={() => setCancelReason(reason)}
                  className="accent-[var(--primary)]"
                />
                {reason}
              </label>
            ))}
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        title="Reschedule this visit"
        description="Pick a new date. The worker will be asked to confirm the slot."
        confirmLabel="Reschedule"
        loading={rescheduleMutation.isPending}
        onConfirm={onReschedule}
      >
        <div className="space-y-1.5">
          <Label htmlFor="new-date">New date</Label>
          <input
            id="new-date"
            type="date"
            value={newDate}
            min={todayKey()}
            onChange={(e) => setNewDate(e.target.value)}
            className="border-input bg-card h-10 w-full rounded-lg border px-3 text-sm"
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={complaintOpen}
        onOpenChange={setComplaintOpen}
        title="Raise a complaint"
        description="Describe the issue and our support team will respond within 24 hours."
        confirmLabel="Submit complaint"
        loading={complaintMutation.isPending}
        onConfirm={onComplaint}
      >
        <div className="space-y-1.5">
          <Label htmlFor="complaint-text">What went wrong?</Label>
          <Textarea
            id="complaint-text"
            rows={4}
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="Describe the issue in detail…"
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title="Rate this service"
        description="Your review is public and helps other customers."
        confirmLabel="Publish review"
        loading={reviewMutation.isPending}
        onConfirm={onReview}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Overall rating</Label>
            <RatingInput value={reviewRating} onChange={setReviewRating} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-text">Your review</Label>
            <Textarea
              id="review-text"
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="How was the service? Was the professional punctual?"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium uppercase">{label}</dt>
      <dd className="mt-0.5 flex items-start gap-1.5 text-sm">
        {icon && <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>}
        <span>{value}</span>
      </dd>
    </div>
  );
}
