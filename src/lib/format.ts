import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { enIN } from "date-fns/locale";

export function formatINR(value: number, options?: { compact?: boolean; withDecimals?: boolean }) {
  if (options?.compact && Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L`;
  }
  if (options?.compact && Math.abs(value) >= 1000) {
    return `₹${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: options?.withDecimals ? 2 : 0,
    minimumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

function safeDate(value: string | Date) {
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : new Date();
}

export function formatDate(value: string | Date, pattern = "dd MMM yyyy") {
  return format(safeDate(value), pattern, { locale: enIN });
}

export function formatDateTime(value: string | Date) {
  return format(safeDate(value), "dd MMM yyyy, h:mm a", { locale: enIN });
}

export function formatTimeAgo(value: string | Date) {
  return `${formatDistanceToNowStrict(safeDate(value))} ago`;
}

export function formatRelativeDay(value: string | Date) {
  const d = safeDate(value);
  const today = new Date();
  const diff = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      86400000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff < -1 && diff > -7) return `${Math.abs(diff)} days ago`;
  return format(d, "dd MMM yyyy", { locale: enIN });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function maskValue(value: string, visible = 4) {
  if (!value) return "";
  const tail = value.slice(-visible);
  return `XXXX XXXX ${tail}`;
}

export function maskCard(value: string) {
  if (!value) return "";
  return `XXXX XXXX XXXX ${value.slice(-4)}`;
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function truncate(value: string, length = 80) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function toDateKey(value: string | Date) {
  return format(safeDate(value), "yyyy-MM-dd");
}

export function todayKey() {
  return toDateKey(new Date());
}

export function addDaysISO(days: number, from: Date = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
