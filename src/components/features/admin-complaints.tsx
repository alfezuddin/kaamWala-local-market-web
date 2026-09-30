"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, Search, ShieldAlert, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { addComplaintNote, getComplaints, updateComplaintStatus } from "@/services/complaints";
import { formatDateTime, formatINR } from "@/lib/format";
import type { Complaint, ComplaintStatus } from "@/types";

type Row = Complaint & {
  customer: { id: string; name: string; email: string } | null;
  worker: { id: string; name: string } | null;
  booking: { id: string; title: string; price: number; visitCharge: number } | null;
};

const STATUS_VARIANT: Record<string, "warning" | "info" | "success" | "destructive"> = {
  OPEN: "warning",
  UNDER_REVIEW: "info",
  RESOLVED: "success",
  REJECTED: "destructive",
};

export function AdminComplaintsPage() {
  const toast = useToast();
  const dbVersion = useDbVersion();
  const [status, setStatus] = React.useState<ComplaintStatus | "ALL">("ALL");
  const [search, setSearch] = React.useState("");
  const [note, setNote] = React.useState("");
  const [resolution, setResolution] = React.useState("");

  const query = useApiQuery(
    ["admin", "complaints", status, search, dbVersion],
    () => getComplaints({ status, search: search.trim() || undefined }),
  );

  const rows = (query.data ?? []) as Row[];

  const setStatusMutation = useApiMutation(
    (vars: { id: string; next: ComplaintStatus; resolution?: string }) =>
      updateComplaintStatus(vars.id, vars.next, vars.resolution),
    {
      onSuccess: (_, vars) => {
        setResolution("");
        toast.success("Complaint updated", `Marked as ${vars.next.replace("_", " ").toLowerCase()}.`);
        query.refetch();
      },
      onError: (error) => toast.error("Could not update complaint", error.message),
    },
  );

  const noteMutation = useApiMutation(
    (vars: { id: string; note: string }) => addComplaintNote(vars.id, vars.note),
    {
      onSuccess: () => {
        setNote("");
        toast.success("Note added", "The resolution timeline has been updated.");
        query.refetch();
      },
      onError: (error) => toast.error("Could not add note", error.message),
    },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints"
        description="Resolve disputes raised by customers and professionals."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Complaints" }]}
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaint, booking, customer…"
              icon={<Search />}
              aria-label="Search complaints"
            />
            {(search || status !== "ALL") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                }}
                icon={<X />}
              >
                Clear
              </Button>
            )}
          </div>
          <Tabs value={status} onValueChange={(v) => setStatus(v as ComplaintStatus | "ALL")}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="OPEN">Open</TabsTrigger>
              <TabsTrigger value="UNDER_REVIEW">Under Review</TabsTrigger>
              <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
              <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <SectionLoader label="Loading complaints…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No complaints found"
          description="Nothing needs attention in this view right now."
        />
      ) : (
        <ul className="space-y-4">
          {rows.map((c) => (
            <li key={c.id}>
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={STATUS_VARIANT[c.status]}>{c.status.replace("_", " ")}</Badge>
                        <span className="text-muted-foreground text-[13px]">#{c.id}</span>
                        <span className="text-muted-foreground text-[13px]">
                          {formatDateTime(c.createdAt)}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-base font-semibold">{c.subject}</h3>
                      <p className="text-muted-foreground text-[13px]">
                        {c.reason} · raised by{" "}
                        <span className="text-foreground font-medium">
                          {c.customer?.name ?? "Unknown customer"}
                        </span>{" "}
                        against{" "}
                        <span className="text-foreground font-medium">
                          {c.worker?.name ?? "the platform"}
                        </span>
                      </p>
                      {c.booking && (
                        <p className="text-muted-foreground mt-0.5 text-[13px]">
                          Booking{" "}
                          <Button asChild variant="link" className="h-auto p-0 text-[13px]">
                            <Link href={`/admin/bookings/${c.booking.id}`}>{c.booking.id}</Link>
                          </Button>{" "}
                          · {c.booking.title} · {formatINR(c.booking.price + c.booking.visitCharge)}
                        </p>
                      )}
                    </div>
                    {c.booking && (
                      <Button asChild variant="outline" size="sm" icon={<MessageSquare />}>
                        <Link href={`/admin/chat?booking=${c.booking.id}`}>Open chat</Link>
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Statement label={`Statement from ${c.customer?.name ?? "customer"}`} text={c.customerStatement} />
                    <Statement
                      label={c.worker ? `Response from ${c.worker.name}` : "Professional response"}
                      text={c.workerStatement || "No statement was submitted."}
                    />
                  </div>

                  {c.resolution && (
                    <div className="border-success/30 bg-success/5 rounded-xl border p-3">
                      <p className="text-[13px] font-medium text-success">Resolution</p>
                      <p className="mt-1 text-sm leading-relaxed">{c.resolution}</p>
                    </div>
                  )}

                  {c.adminNotes.length > 0 && (
                    <details className="text-[13px]">
                      <summary className="cursor-pointer text-muted-foreground font-medium">
                        {c.adminNotes.length} internal note{c.adminNotes.length > 1 ? "s" : ""}
                      </summary>
                      <ul className="mt-2 space-y-1.5">
                        {c.adminNotes.map((n) => (
                          <li key={n.id} className="text-muted-foreground">
                            {n.note}{" "}
                            <span className="opacity-70">({formatDateTime(n.createdAt)})</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div className="border-border space-y-4 border-t pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor={`note-${c.id}`}>Add internal note</Label>
                        <Textarea
                          id={`note-${c.id}`}
                          rows={2}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Only visible to the admin team."
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={note.trim().length < 3 || noteMutation.isPending}
                          onClick={() => noteMutation.mutate({ id: c.id, note: note.trim() })}
                        >
                          Save note
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`resolution-${c.id}`}>Resolution summary</Label>
                        <Textarea
                          id={`resolution-${c.id}`}
                          rows={2}
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          placeholder="Shown to the customer and professional."
                        />
                        <div className="flex flex-wrap gap-2">
                          {c.status === "OPEN" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setStatusMutation.mutate({ id: c.id, next: "UNDER_REVIEW" })}
                            >
                              Start review
                            </Button>
                          )}
                          {c.status !== "RESOLVED" && (
                            <Button
                              size="sm"
                              disabled={resolution.trim().length < 10}
                              onClick={() =>
                                setStatusMutation.mutate({
                                  id: c.id,
                                  next: "RESOLVED",
                                  resolution: resolution.trim(),
                                })
                              }
                              icon={<ShieldAlert />}
                            >
                              Mark resolved
                            </Button>
                          )}
                          {c.status !== "REJECTED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={resolution.trim().length < 10}
                              onClick={() =>
                                setStatusMutation.mutate({
                                  id: c.id,
                                  next: "REJECTED",
                                  resolution: resolution.trim(),
                                })
                              }
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Statement({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-border bg-muted/40 rounded-xl border p-3">
      <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
      <p className="mt-1 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
