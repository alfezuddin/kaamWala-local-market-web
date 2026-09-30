import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import type { BadgeProps } from "./badge";

type Tone = "success" | "warning" | "destructive" | "info" | "muted" | "brand" | "default";

const STATUS_MAP: Record<string, { label: string; tone: Tone; dot?: boolean }> = {
  // bookings
  REQUESTED: { label: "Requested", tone: "warning", dot: true },
  ACCEPTED: { label: "Accepted", tone: "info", dot: true },
  CONFIRMED: { label: "Confirmed", tone: "brand", dot: true },
  ON_THE_WAY: { label: "On the way", tone: "info", dot: true },
  IN_PROGRESS: { label: "In Progress", tone: "brand", dot: true },
  COMPLETED: { label: "Completed", tone: "success", dot: true },
  CANCELLED: { label: "Cancelled", tone: "destructive", dot: true },
  REJECTED: { label: "Rejected", tone: "destructive", dot: true },
  // payments
  PAID: { label: "Paid", tone: "success", dot: true },
  PENDING: { label: "Pending", tone: "warning", dot: true },
  REFUNDED: { label: "Refunded", tone: "info", dot: true },
  FAILED: { label: "Failed", tone: "destructive", dot: true },
  // users / verification
  ACTIVE: { label: "Active", tone: "success", dot: true },
  SUSPENDED: { label: "Suspended", tone: "destructive", dot: true },
  APPROVED: { label: "Approved", tone: "success", dot: true },
  // complaints
  OPEN: { label: "Open", tone: "warning", dot: true },
  UNDER_REVIEW: { label: "Under Review", tone: "info", dot: true },
  RESOLVED: { label: "Resolved", tone: "success", dot: true },
  // services
  INACTIVE: { label: "Disabled", tone: "muted", dot: true },
  // misc
  CUSTOMER: { label: "Customer", tone: "brand" },
  WORKER: { label: "Worker", tone: "info" },
  ADMIN: { label: "Admin", tone: "default" },
  UPI: { label: "UPI", tone: "brand" },
  CARD: { label: "Card", tone: "info" },
  CASH: { label: "Cash", tone: "muted" },
  WALLET: { label: "Wallet", tone: "default" },
  BOOKING: { label: "Booking", tone: "brand" },
  SYSTEM: { label: "System", tone: "muted" },
};

const DOT_COLORS: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  muted: "bg-muted-foreground",
  brand: "bg-brand",
  default: "bg-primary",
};

export function StatusBadge({
  status,
  label,
  className,
  size = "default",
  withDot = true,
}: {
  status: string;
  label?: string;
  className?: string;
  size?: BadgeProps["size"];
  withDot?: boolean;
}) {
  const conf = STATUS_MAP[status] ?? { label: label ?? status, tone: "muted" as Tone, dot: false };
  return (
    <Badge variant={conf.tone} size={size} className={className}>
      {withDot && conf.dot && <span className={cn("size-1.5 rounded-full", DOT_COLORS[conf.tone])} />}
      {label ?? conf.label}
    </Badge>
  );
}

export function VerifiedBadge({ className, size = "default" }: { className?: string; size?: BadgeProps["size"] }) {
  return (
    <Badge variant="success" size={size} className={className}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-3" aria-hidden>
        <path
          fillRule="evenodd"
          d="M8.6 2.6a1 1 0 0 1 1.2-.55l1.5.55c.1.04.2.1.3.1h1.8a1 1 0 0 1 .3-.1l1.5-.55a1 1 0 0 1 1.2.55l.7 1.3c.1.15.22.28.37.38l1.3.7a1 1 0 0 1 .55 1.2l-.55 1.5c-.04.1-.06.2-.06.3v1.8c0 .1.02.2.06.3l.55 1.5a1 1 0 0 1-.55 1.2l-1.3.7c-.15.1-.28.22-.37.38l-.7 1.3a1 1 0 0 1-1.2.55l-1.5-.55a1 1 0 0 0-.3-.06h-1.8a1 1 0 0 0-.3.06l-1.5.55a1 1 0 0 1-1.2-.55l-.7-1.3a1 1 0 0 0-.37-.38l-1.3-.7a1 1 0 0 1-.55-1.2l.55-1.5c.04-.1.06-.2.06-.3v-1.8c0-.1-.02-.2-.06-.3l-.55-1.5a1 1 0 0 1 .55-1.2l1.3-.7c.15-.1.28-.22.37-.38l.7-1.3a1 1 0 0 1 .2-.3Z M9.9 8.3a1 1 0 0 0-1.4 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.6-3.6a1 1 0 0 0-1.4-1.4l-2.9 2.9-1.4-1.4a1 1 0 0 0-.3-.2Z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </Badge>
  );
}
