"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  IndianRupee,
  
  
  Navigation,
  Phone,
  PlayCircle,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState, SectionLoader } from "@/components/ui/states";
import { InfoBanner, PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import {
  acceptBooking,
  completeBooking,
  getBookingById,
  markOnTheWay,
  rejectBooking,
  startJob,
} from "@/services/bookings";
import { formatDate, formatDateTime, formatINR, formatRelativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types";

const REJECT_REASONS = [
  "Outside my service area",
  "Not available at this time",
  "Required materials not available",
  "Job description is unclear",
];

const TIMELINE_LABEL: Record<BookingStatus, string> = {
  REQUESTED: "Request raised",
  ACCEPTED: "Accepted by professional",
  CONFIRMED: "Confirmed by customer",
  ON_THE_WAY: "On the way",
  IN_PROGRESS: "Work in progress",
  COMPLETED: "Job completed",
  CANCELLED: "Cancelled",
  REJECTED: "Declined",
};

export function WorkerJobDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { session } = useAuth();
  const dbVersion = useDbVersion();
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState(REJECT_REASONS[0]);
  const [completeOpen, setCompleteOpen] = React.useState(false);
  const [completionNote, setCompletionNote] = React.useState("");

  const query = useApiQuery(["booking", id, dbVersion], () => getBookingById(id));


  const accept = useApiMutation(() => acceptBooking(id), {
    onSuccess: () => {
      toast.success("Job accepted", "The customer has been notified.");
      query.refetch();
    },
    onError: (error) => toast.error("Could not accept job", error.message),
  });

  const reject = useApiMutation((reason: string) => rejectBooking(id, reason), {
    onSuccess: () => {
      setRejectOpen(false);
      toast.info("Request declined", "The customer can now choose another professional.");
      query.refetch();
    },
    onError: (error) => toast.error("Could not decline job", error.message),
  });

  const onTheWay = useApiMutation((eta: number) => markOnTheWay(id, eta), {
    onSuccess: () => {
      toast.success("Customer notified", "They can now track your arrival.");
      query.refetch();
    },
    onError: (error) => toast.error("Could not update status", error.message),
  });

  const start = useApiMutation(() => startJob(id), {
    onSuccess: () => {
      toast.success("Job started", "Mark the work complete when you finish.");
      query.refetch();
    },
    onError: (error) => toast.error("Could not start job", error.message),
  });

  const complete = useApiMutation((note: string) => completeBooking(id, note), {
    onSuccess: () => {
      setCompletionNote("");
      setCompleteOpen(false);
      toast.success("Job completed", "Your earnings have been updated.");
      query.refetch();
    },
    onError: (error) => toast.error("Could not complete job", error.message),
  });

  if (query.isLoading) return <SectionLoader label="Loading job…" />;
  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => query.refetch()} />;
  }

  const booking = query.data;
  const worker = query.data.worker;
  const customer = query.data.customer;
  const service = query.data.service;
  const isMine = worker?.id === session?.userId;
  const total = booking.price + booking.visitCharge;
  const earning = total - booking.platformFee;

  return (
    <div className="space-y-6">
      <PageHeader
        title={booking.title}
        description={`${booking.id} · raised ${formatRelativeDay(booking.createdAt)}`}
        breadcrumbs={[
          { label: "Professional", href: "/worker/dashboard" },
          { label: "Jobs", href: "/worker/jobs" },
          { label: booking.id },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push("/worker/jobs")} icon={<ArrowLeft />}>
            All jobs
          </Button>
        }
      />

      {!isMine && (
        <InfoBanner
          variant="warning"
          title="This job is assigned to another professional"
          description="You can read the details, but only the assigned professional can change the job status."
        />
      )}

      {booking.status === "REQUESTED" && isMine && (
        <InfoBanner
          variant="warning"
          icon={<ClipboardCheck />}
          title="New request waiting for your response"
          description="Accept to confirm the slot, or decline with a reason so the customer can pick someone else."
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectOpen(true)} icon={<ThumbsDown />}>
                Decline
              </Button>
              <Button size="sm" onClick={() => accept.mutate()} loading={accept.isPending} icon={<ThumbsUp />}>
                Accept job
              </Button>
            </div>
          }
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{booking.description}</p>
              {booking.notes && (
                <div className="bg-muted/60 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase">Customer notes</p>
                  <p className="mt-1 text-sm">{booking.notes}</p>
                </div>
              )}
              <dl className="grid gap-3 sm:grid-cols-2">
                <Detail label="Service" value={service?.name ?? booking.title} />
                <Detail
                  label="Schedule"
                  value={`${formatDate(booking.scheduledDate)} at ${booking.scheduledTime}`}
                  hint={booking.isFlexible ? "Flexible timing" : "Fixed timing"}
                />
                <Detail
                  label="Address"
                  value={`${booking.address.line1}, ${booking.address.area}`}
                  hint={`${booking.address.city} ${booking.address.pincode}${
                    booking.address.landmark ? ` · near ${booking.address.landmark}` : ""
                  }`}
                />
                <Detail label="Payment" value={booking.paymentStatus} hint={`Paid via ${booking.paymentMethod}`} />
              </dl>

              <div className="border-border flex flex-wrap gap-2 rounded-xl border p-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.info(
                      "Navigation",
                      `Opening directions to ${booking.address.line1}, ${booking.address.area}.`,
                    )
                  }
                  icon={<Navigation />}
                >
                  Navigate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.info("Calling customer", "Your number is shared for this booking only.")
                  }
                  icon={<Phone />}
                >
                  Call customer
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/worker/chat?booking=${booking.id}`}>Message</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {booking.timeline.map((step, i) => (
                  <li key={`${step.status}-${step.at}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
                          i === booking.timeline.length - 1
                            ? "bg-brand text-white"
                            : "bg-success/15 text-success",
                        )}
                      >
                        {i === booking.timeline.length - 1 ? i + 1 : <CheckCircle2 className="size-3.5" />}
                      </span>
                      {i < booking.timeline.length - 1 && <span className="bg-border my-1 w-px flex-1" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-medium">{TIMELINE_LABEL[step.status]}</p>
                      <p className="text-muted-foreground text-[13px]">
                        {formatDateTime(step.at)}
                        {step.note ? ` · ${step.note}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {customer && (
            <Card>
              <CardContent className="flex items-center gap-3">
                <AvatarCircle name={customer.name} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{customer.name}</p>
                  <p className="text-muted-foreground text-[13px]">{customer.email}</p>
                  <p className="text-muted-foreground text-xs">
                    {customer.totalBookings} bookings · {customer.area}, {customer.city}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your earnings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Service charge</span>
                <span className="tabular-nums">{formatINR(booking.price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Visit charge</span>
                <span className="tabular-nums">{formatINR(booking.visitCharge)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Platform fee</span>
                <span className="text-destructive tabular-nums">−{formatINR(booking.platformFee)}</span>
              </div>
              <div className="border-border flex items-center justify-between border-t pt-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <IndianRupee className="size-4" />
                  You receive
                </span>
                <span className="text-lg font-bold tabular-nums">{formatINR(earning)}</span>
              </div>
            </CardContent>
          </Card>

          {isMine && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {booking.status === "ACCEPTED" && (
                  <EtaPicker
                    onPick={(eta) => onTheWay.mutate(eta)}
                    loading={onTheWay.isPending}
                    customerPhone={customer?.phone}
                  />
                )}
                {booking.status === "CONFIRMED" && (
                  <Button
                    className="w-full"
                    onClick={() => start.mutate()}
                    loading={start.isPending}
                    icon={<PlayCircle />}
                  >
                    Start the job
                  </Button>
                )}
                {booking.status === "IN_PROGRESS" && (
                  <Button
                    className="w-full"
                    onClick={() => setCompleteOpen(true)}
                    icon={<CheckCircle2 />}
                  >
                    Mark job complete
                  </Button>
                )}
                {(booking.status === "COMPLETED" || booking.status === "CANCELLED" || booking.status === "REJECTED") && (
                  <p className="text-muted-foreground text-[13px]">
                    This job is closed. There are no further actions available.
                  </p>
                )}
                {booking.status === "ON_THE_WAY" && (
                  <p className="text-muted-foreground text-[13px]">
                    You are marked on the way{booking.workerEta ? ` with a ${booking.workerEta} minute ETA` : ""}.
                    The job can be started once you arrive.
                  </p>
                )}
                {booking.status === "REQUESTED" && (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => accept.mutate()}
                      loading={accept.isPending}
                      icon={<ThumbsUp />}
                    >
                      Accept job
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setRejectOpen(true)} icon={<ThumbsDown />}>
                      Decline
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Decline this request?"
        description="Let the customer know why so they can pick another professional quickly."
        confirmLabel="Decline request"
        loading={reject.isPending}
        onConfirm={() => reject.mutate(rejectReason)}
      >
        <div className="space-y-1.5">
          <Label>Reason</Label>
          <div className="grid gap-1.5">
            {REJECT_REASONS.map((reason) => (
              <label key={reason} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="reject-reason"
                  className="size-4 accent-brand"
                  checked={rejectReason === reason}
                  onChange={() => setRejectReason(reason)}
                />
                {reason}
              </label>
            ))}
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="Mark this job as complete?"
        description="Your earnings will be recorded and the customer can leave a review. The work summary is shared with the customer."
        confirmLabel="Mark complete"
        loading={complete.isPending}
        onConfirm={() => complete.mutate(completionNote)}
      >
        <div className="space-y-1.5">
          <Label htmlFor="completion-note">Work summary (optional)</Label>
          <Textarea
            id="completion-note"
            rows={3}
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            placeholder="What did you do? Any parts the customer should know about?"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}

function Detail({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
      {hint && <dd className="text-muted-foreground text-[13px]">{hint}</dd>}
    </div>
  );
}

function EtaPicker({
  onPick,
  loading,
  customerPhone,
}: {
  onPick: (eta: number) => void;
  loading: boolean;
  customerPhone?: string;
}) {
  const [eta, setEta] = React.useState(30);
  return (
    <div className="space-y-2">
      <Label htmlFor="eta">Share your arrival time</Label>
      <div className="flex gap-2">
        <Input
          id="eta"
          type="number"
          min={5}
          max={240}
          step={5}
          value={eta}
          onChange={(e) => setEta(Math.max(5, Math.min(240, Number(e.target.value) || 5)))}
          className="w-24"
        />
        <Button
          className="flex-1"
          onClick={() => onPick(eta)}
          loading={loading}
          disabled={!customerPhone}
          icon={<Navigation />}
        >
          Mark on the way
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        The customer sees your ETA in their app and at {customerPhone ?? "their saved number"}.
      </p>
    </div>
  );
}
