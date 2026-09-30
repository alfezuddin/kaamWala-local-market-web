"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChips, SearchBar } from "@/components/ui/search-bar";
import { BookingCard } from "@/components/ui/booking-card";
import { EmptyState, ErrorState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiQuery } from "@/hooks/use-api";
import { getBookings } from "@/services/bookings";
import { useDbVersion } from "@/hooks/use-mounted";
import { getDb } from "@/mock/db";
import type { Booking } from "@/types";

const TABS: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "REQUESTED", label: "Requested" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAGE_SIZE = 8;

export function CustomerBookingsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { session } = useAuth();
  const userId = session?.userId;
  const dbVersion = useDbVersion();

  const [status, setStatus] = React.useState<string>(params.get("status") ?? "ALL");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  // Changing a filter always returns to the first page; tracking the filter
  // signature during render avoids a resettling effect.
  const filterKey = `${status}|${search}`;
  const [lastFilterKey, setLastFilterKey] = React.useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const query = useApiQuery(
    ["customer", "bookings", userId, status, dbVersion],
    () => (userId ? getBookings({ customerId: userId }) : Promise.resolve<Booking[]>([])),
    { enabled: Boolean(userId) },
  );

  const db = getDb();
  const all = query.data ?? [];
  const counts = TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.value] =
      tab.value === "ALL" ? all.length : all.filter((b) => b.status === (tab.value as Booking["status"])).length;
    return acc;
  }, {});

  const filtered = all
    .filter((b) => status === "ALL" || b.status === status)
    .filter((b) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const worker = db.workers.find((w) => w.id === b.workerId);
      return (
        b.title.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (worker?.name.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bookings"
        description="Every request, visit and completed job in one place."
        breadcrumbs={[{ label: "Customer", href: "/customer/dashboard" }, { label: "Bookings" }]}
        actions={
          <Button asChild icon={<CalendarPlus />}>
            <Link href="/customer/book/new">New booking</Link>
          </Button>
        }
      />

      <FilterChips
        items={TABS.map((t) => ({ value: t.value, label: t.label, count: counts[t.value] ?? 0 }))}
        active={status}
        onChange={setStatus}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by service, booking ID or worker…"
          className="sm:max-w-sm"
        />
        <div className="text-muted-foreground flex items-center gap-2 sm:ml-auto">
          <Filter className="size-4" />
          <span className="text-[13px]">
            {filtered.length} booking{filtered.length === 1 ? "" : "s"}
          </span>
          {status !== "ALL" && (
            <Button variant="ghost" size="xs" onClick={() => setStatus("ALL")} icon={<X />}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {query.isLoading ? (
        <SectionLoader label="Loading bookings…" />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon="book"
          title={search ? "No matching bookings" : "No bookings here yet"}
          description={
            search
              ? "Try a different service name, booking ID or worker."
              : "When you request a service it will show up here with live status updates."
          }
          actionLabel={search ? undefined : "Book a service"}
          actionHref={search ? undefined : "/customer/book/new"}
        />
      ) : (
        <>
          <div className="space-y-3">
            {pageItems.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                worker={db.workers.find((w) => w.id === booking.workerId) ?? null}
                service={db.services.find((s) => s.id === booking.serviceId) ?? null}
                href={`/customer/bookings/${booking.id}`}
                actions={
                  <Button size="sm" variant="outline" onClick={() => router.push(`/customer/bookings/${booking.id}`)}>
                    View details
                  </Button>
                }
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-muted-foreground text-[13px]">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
