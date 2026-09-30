"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Phone,
  Receipt,
  
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader, SectionCard } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { getBookingById } from "@/services/bookings";
import { downloadInvoice } from "@/lib/print";
import { formatDateTime, formatINR } from "@/lib/format";

const TIMELINE = [
  { status: "REQUESTED", label: "Requested" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "ON_THE_WAY", label: "On the way" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "COMPLETED", label: "Completed" },
] as const;

export function AdminBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const dbVersion = useDbVersion();

  const query = useApiQuery(["admin", "booking", id, dbVersion], () => getBookingById(id));

  if (query.isLoading) return <SectionLoader label="Loading booking…" />;

  const booking = query.data;
  if (!booking) {
    return (
      <EmptyState
        icon="search"
        title="Booking not found"
        description={`No booking matches ${id}. It may have been removed.`}
        actionLabel="Back to bookings"
        onAction={() => router.push("/admin/bookings")}
      />
    );
  }

  const stepIndex = TIMELINE.findIndex((s) => s.status === booking.status);
  const total = booking.price + booking.visitCharge;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push("/admin/bookings")} icon={<ArrowLeft />}>
        All bookings
      </Button>

      <PageHeader
        title={booking.id}
        description={`${booking.title} · ${formatDateTime(booking.scheduledDate)} at ${booking.scheduledTime}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Bookings", href: "/admin/bookings" },
          { label: booking.id },
        ]}
        actions={
          <>
            <Button asChild variant="outline" icon={<MessageSquare />}>
              <Link href={`/admin/chat?booking=${booking.id}`}>Open chat</Link>
            </Button>
            {booking.transaction && (
              <Button
                variant="outline"
                icon={<Receipt />}
                onClick={() => {
                  downloadInvoice(booking.transaction!);
                  toast.success("Invoice downloaded", booking.transaction!.invoiceNo);
                }}
              >
                Invoice
              </Button>
            )}
            {(booking.status === "CANCELLED" || booking.status === "REJECTED") && (
              <Badge variant="destructive" className="h-8 px-3">
                <Ban className="size-3.5" /> Job closed
              </Badge>
            )}
          </>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={booking.status} />
            <Badge variant={booking.paymentStatus === "PAID" ? "success" : "warning"}>
              {booking.paymentStatus === "PAID" ? "Paid" : booking.paymentStatus === "REFUNDED" ? "Refunded" : "Payment pending"}
            </Badge>
            {booking.paymentMethod && <Badge variant="outline">Paid via {booking.paymentMethod}</Badge>}
          </div>

          {stepIndex >= 0 ? (
            <ol className="flex flex-wrap gap-2">
              {TIMELINE.map((s, i) => (
                <li
                  key={s.status}
                  className={`rounded-lg px-2.5 py-1.5 text-[13px] font-medium ${
                    i < stepIndex
                      ? "bg-success-soft text-success"
                      : i === stepIndex
                        ? "bg-brand text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < stepIndex && <CheckCircle2 className="mr-1 inline size-3.5" />}
                  {s.label}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground text-sm">
              This booking ended as {booking.status.toLowerCase().replace("_", " ")}.
            </p>
          )}

          {booking.completionNote && (
            <p className="bg-success/8 border-success/30 text-success rounded-lg border p-3 text-[13px]">
              <span className="font-medium">Work summary from the professional:</span>{" "}
              {booking.completionNote}
            </p>
          )}

          {booking.cancelReason && (
            <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-[13px]">
              <span className="font-medium">Cancellation reason:</span> {booking.cancelReason}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Job details">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Row label="Service" value={booking.service?.name ?? booking.title} />
              <Row label="Category" value={booking.category?.name ?? "—"} />
              <Row label="Scheduled" value={`${formatDateTime(booking.scheduledDate)} · ${booking.scheduledTime}`} />
              <Row label="Booked on" value={formatDateTime(booking.createdAt)} />
              <Row label="Address" value={`${booking.address.line1}, ${booking.address.area}, ${booking.address.city}`} />
              <Row label="Customer contact" value={booking.customer?.phone ?? "Not provided"} />
            </dl>
            {booking.notes && (
              <p className="border-border bg-muted/40 mt-3 rounded-lg border p-3 text-sm">{booking.notes}</p>
            )}
          </SectionCard>

          <SectionCard title="People">
            <div className="grid gap-3 sm:grid-cols-2">
              <Person
                label="Customer"
                id={booking.customer?.id}
                name={booking.customer?.name ?? "Removed customer"}
                detail={booking.customer?.phone}
                href={booking.customer ? `/admin/customers?q=${encodeURIComponent(booking.customer.name)}` : undefined}
              />
              <Person
                label="Professional"
                id={booking.worker?.id}
                name={booking.worker?.name ?? "Unassigned"}
                detail={booking.worker ? `${booking.worker.headline} · ${booking.worker.phone}` : undefined}
                href={booking.worker ? `/admin/workers?q=${encodeURIComponent(booking.worker.name)}` : undefined}
              />
            </div>
          </SectionCard>

          {(booking.complaint || booking.review) && (
            <SectionCard title="Aftercare">
              <div className="space-y-3">
                {booking.complaint && (
                  <div className="border-border rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={booking.complaint.status === "RESOLVED" ? "success" : "warning"}>
                        Complaint {booking.complaint.status.replace("_", " ").toLowerCase()}
                      </Badge>
                      <span className="text-muted-foreground text-[13px]">{booking.complaint.subject}</span>
                    </div>
                    <p className="mt-1.5 text-sm">{booking.complaint.customerStatement}</p>
                    <Button asChild variant="link" className="h-auto p-0 text-[13px]">
                      <Link href="/admin/complaints">Handle in complaints →</Link>
                    </Button>
                  </div>
                )}
                {booking.review && (
                  <div className="border-border rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <RatingStars value={booking.review.rating} size="sm" />
                      {booking.review.isHidden && <Badge variant="destructive">Hidden</Badge>}
                    </div>
                    <p className="mt-1.5 text-sm">{booking.review.comment}</p>
                    <Button asChild variant="link" className="h-auto p-0 text-[13px]">
                      <Link href="/admin/reviews">Moderate in reviews →</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="Payment">
            <dl className="space-y-2.5 text-sm">
              <MoneyRow label="Service charge" value={formatINR(booking.price)} />
              <MoneyRow label="Visit charge" value={formatINR(booking.visitCharge)} />
              <div className="border-border flex justify-between border-t pt-2.5 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(total)}</span>
              </div>
              {booking.transaction && (
                <>
                  <MoneyRow label="Platform fee" value={`${formatINR(booking.transaction.platformFee)}`} tone="success" />
                  <MoneyRow
                    label="Professional earning"
                    value={formatINR(booking.transaction.workerEarning)}
                  />
                  <p className="text-muted-foreground pt-1 text-[13px]">
                    {booking.transaction.invoiceNo} · {formatDateTime(booking.transaction.createdAt)}
                  </p>
                </>
              )}
            </dl>
          </SectionCard>

          <SectionCard title="Location" icon={<MapPin />}>
            <p className="text-sm leading-relaxed">
              {booking.address.line1}
              <br />
              {booking.address.area}, {booking.address.city} {booking.address.pincode}
            </p>
            {booking.address.landmark && (
              <p className="text-muted-foreground mt-1 text-[13px]">Landmark: {booking.address.landmark}</p>
            )}
            {booking.customer?.phone && (
              <Button asChild variant="outline" size="sm" className="mt-3" icon={<Phone />}>
                <a href={`tel:${booking.customer.phone}`}>{booking.customer.phone}</a>
              </Button>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${tone === "success" ? "text-success font-medium" : ""}`}>{value}</span>
    </div>
  );
}

function Person({
  label,
  name,
  detail,
  href,
}: {
  label: string;
  id?: string;
  name: string;
  detail?: string;
  href?: string;
}) {
  return (
    <div className="border-border rounded-lg border p-3">
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      {href ? (
        <Button asChild variant="link" className="h-auto p-0 text-sm">
          <Link href={href}>{name}</Link>
        </Button>
      ) : (
        <p className="text-sm font-medium">{name}</p>
      )}
      {detail && <p className="text-muted-foreground text-[13px]">{detail}</p>}
    </div>
  );
}
