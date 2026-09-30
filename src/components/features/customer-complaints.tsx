"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Plus, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { getComplaints, createComplaint } from "@/services/complaints";
import { getDb } from "@/mock/db";
import { startConversation } from "@/services/chat";
import { useDbVersion } from "@/hooks/use-mounted";
import { formatDateTime, formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Complaint, ComplaintReason } from "@/types";

const REASONS: { value: ComplaintReason; label: string }[] = [
  { value: "QUALITY_ISSUE", label: "Poor quality of work" },
  { value: "NO_SHOW", label: "Professional did not show up" },
  { value: "OVERCHARGE", label: "Charged more than agreed" },
  { value: "UNPROFESSIONAL", label: "Unprofessional behaviour" },
  { value: "DAMAGE", label: "Property damage" },
  { value: "OTHER", label: "Something else" },
];

const STATUS_TONE: Record<string, string> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  REJECTED: "destructive",
};

export function CustomerComplaintsPage() {
  const toast = useToast();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.userId;
  const dbVersion = useDbVersion();

  const [open, setOpen] = React.useState(false);
  const [bookingId, setBookingId] = React.useState("");
  const [workerId, setWorkerId] = React.useState("");
  const [reason, setReason] = React.useState<ComplaintReason>("QUALITY_ISSUE");
  const [statement, setStatement] = React.useState("");
  const [startingChat, setStartingChat] = React.useState<string | null>(null);

  const query = useApiQuery(
    ["complaints", "customer", userId, dbVersion],
    () => (userId ? getComplaints({ customerId: userId }) : Promise.resolve<Complaint[]>([])),
    { enabled: Boolean(userId) },
  );
  const create = useApiMutation(
    (vars: { bookingId: string; workerId: string; reason: ComplaintReason; statement: string }) =>
      createComplaint({
        bookingId: vars.bookingId,
        customerId: userId ?? "",
        workerId: vars.workerId,
        reason: vars.reason,
        subject: REASONS.find((r) => r.value === vars.reason)?.label ?? "Complaint",
        statement: vars.statement,
      }),
    {
      onSuccess: () => {
        setOpen(false);
        setStatement("");
        toast.success("Complaint submitted", "Our support team will respond within 24 hours.");
        query.refetch();
      },
      onError: (error) => toast.error("Could not submit complaint", error.message),
    },
  );

  // "Ask a question" opens the live thread with the professional on the job.
  // The admin console can join the same thread, so this is real support.
  const openThread = async (bookingId: string, workerId: string) => {
    if (!workerId) {
      toast.warning("No professional assigned", "This booking has not been assigned yet.");
      return;
    }
    setStartingChat(bookingId);
    try {
      const conversation = await startConversation(session?.userId ?? "", workerId, bookingId);
      router.push(`/customer/chat?conversation=${conversation.id}`);
    } catch {
      toast.error("Could not open the chat", "Please try again in a moment.");
    } finally {
      setStartingChat(null);
    }
  };

  const complaints = query.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints & Support"
        description="Raise an issue against a booking and track how it is being resolved."
        breadcrumbs={[{ label: "Customer", href: "/customer/dashboard" }, { label: "Complaints" }]}
        actions={
          <>
            <Button asChild variant="outline" icon={<MessageCircle />}>
              <Link href="/customer/chat">Open chat</Link>
            </Button>
            <Button onClick={() => setOpen(true)} icon={<Plus />}>
              New complaint
            </Button>
          </>
        }
      />

      {query.isLoading ? (
        <SectionLoader label="Loading complaints…" />
      ) : complaints.length === 0 ? (
        <EmptyState
          icon="alert"
          title="No complaints raised"
          description="If something went wrong with a job, raise a complaint and our team will step in."
          actionLabel="Raise a complaint"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                <div className="min-w-0">
                  <CardTitle className="text-base">{complaint.subject}</CardTitle>
                  <p className="text-muted-foreground mt-0.5 text-[13px]">
                    {complaint.id} · raised {formatTimeAgo(complaint.createdAt)}
                  </p>
                </div>
                <Badge variant={STATUS_TONE[complaint.status] as never}>{complaint.status.replace("_", " ")}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase">Your statement</p>
                  <p className="mt-1 text-sm leading-relaxed">{complaint.customerStatement}</p>
                </div>

                {complaint.workerStatement && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-muted-foreground text-xs font-medium uppercase">Professional&apos;s response</p>
                    <p className="mt-1 text-sm leading-relaxed">{complaint.workerStatement}</p>
                  </div>
                )}

                {complaint.resolution && (
                  <div className="bg-success/8 border-success/30 rounded-lg border p-3">
                    <p className="text-success text-xs font-medium uppercase">Resolution</p>
                    <p className="mt-1 text-sm leading-relaxed">{complaint.resolution}</p>
                    {complaint.resolvedAt && (
                      <p className="text-muted-foreground mt-1 text-xs">Closed {formatDateTime(complaint.resolvedAt)}</p>
                    )}
                  </div>
                )}

                {complaint.adminNotes.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs font-medium uppercase">Support notes</p>
                    {complaint.adminNotes.map((note) => (
                      <p key={note.id} className="text-muted-foreground text-[13px]">
                        {note.note} <span className="opacity-70">· {formatTimeAgo(note.createdAt)}</span>
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/customer/bookings/${complaint.bookingId}`}>View booking</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={startingChat === complaint.bookingId}
                    onClick={() => openThread(complaint.bookingId, complaint.workerId)}
                    icon={<MessageCircle />}
                  >
                    {startingChat === complaint.bookingId ? "Opening…" : "Ask a question"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ComplaintForm
        open={open}
        onOpenChange={setOpen}
        bookingId={bookingId}
        reason={reason}
        statement={statement}
        pending={create.isPending}
        onBookingChange={setBookingId}
        onWorkerChange={setWorkerId}
        onReasonChange={setReason}
        onStatementChange={setStatement}
        onSubmit={() => {
          if (!bookingId) {
            toast.warning("Select a booking", "A complaint must be linked to a booking.");
            return;
          }
          if (statement.trim().length < 10) {
            toast.warning("Add more detail", "Please describe the issue in at least 10 characters.");
            return;
          }
          create.mutate({ bookingId, workerId, reason, statement: statement.trim() });
        }}
      />
    </div>
  );
}

function ComplaintForm({
  open,
  onOpenChange,
  bookingId,
  reason,
  statement,
  pending,
  onBookingChange,
  onWorkerChange,
  onReasonChange,
  onStatementChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bookingId: string;
  reason: ComplaintReason;
  statement: string;
  pending: boolean;
  onBookingChange: (v: string) => void;
  onWorkerChange: (v: string) => void;
  onReasonChange: (v: ComplaintReason) => void;
  onStatementChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const { session } = useAuth();
  const db = getDb();
  const eligible = db.bookings.filter(
    (b) => b.customerId === session?.userId && b.status !== "REQUESTED",
  );
  const selectedBooking = eligible.find((b) => b.id === bookingId);
  const selectedWorker = selectedBooking?.workerId
    ? (db.workers.find((w) => w.id === selectedBooking.workerId) ?? null)
    : null;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Raise a complaint"
      description="Tell us what went wrong. We aim to respond within 24 hours."
      confirmLabel="Submit complaint"
      loading={pending}
      onConfirm={onSubmit}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="complaint-booking">Booking</Label>
          <Select
            value={bookingId}
            onValueChange={(v) => {
              onBookingChange(v);
              const booking = eligible.find((b) => b.id === v);
              if (booking?.workerId) onWorkerChange(booking.workerId);
            }}
          >
            <SelectTrigger id="complaint-booking">
              <SelectValue placeholder="Select a booking" />
            </SelectTrigger>
            <SelectContent>
              {eligible.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.title} · {b.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedBooking && (
          <p className="text-muted-foreground rounded-lg bg-muted/40 p-2.5 text-[13px]">
            This complaint goes to{" "}
            <span className="text-foreground font-medium">
              {selectedWorker?.name ?? "our support team"}
            </span>{" "}
            for booking {selectedBooking.id}.
          </p>
        )}
        <div className="space-y-1.5">
          <Label>Reason</Label>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => onReasonChange(r.value)}
                aria-pressed={reason === r.value}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-[13px] transition",
                  reason === r.value ? "border-brand bg-brand-soft text-brand-soft-foreground" : "border-border hover:border-brand/40",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="complaint-statement">Describe the issue</Label>
          <Textarea
            id="complaint-statement"
            rows={4}
            value={statement}
            onChange={(e) => onStatementChange(e.target.value)}
            placeholder="What happened, when, and what outcome you are looking for."
          />
        </div>
        <p className="text-muted-foreground flex items-start gap-2 text-[13px]">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          Serious safety issues should also be reported to the relevant authorities. We will cooperate fully.
        </p>
      </div>
    </ConfirmDialog>
  );
}

export { StatusBadge };
