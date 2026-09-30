"use client";

import * as React from "react";
import Link from "next/link";
import { Ban, CheckCircle2, Download, MapPin, Search, ShieldCheck,  Trash2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { RatingStars } from "@/components/ui/rating-stars";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { deleteUser, getAllUsers, setUserStatus } from "@/services/admin";
import { exportRowsToCsv } from "@/lib/csv";
import { formatDate, formatTimeAgo } from "@/lib/format";
import type { Role } from "@/types";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "info" | "muted"> = {
  ACTIVE: "success",
  SUSPENDED: "destructive",
  PENDING: "warning",
};

export function AdminPeoplePage({ role }: { role: Extract<Role, "CUSTOMER" | "WORKER"> }) {
  const toast = useToast();
  const dbVersion = useDbVersion();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"ALL" | "ACTIVE" | "SUSPENDED" | "PENDING">("ALL");
  const [city, setCity] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const [confirm, setConfirm] = React.useState<{ id: string; name: string; action: "suspend" | "activate" | "delete" } | null>(null);

  const PAGE_SIZE = 10;

  const term = search.trim();
  const query = useApiQuery(
    ["admin", "users", role, dbVersion, term, status],
    () => getAllUsers({ role, search: term || undefined, status }),
    { enabled: true, placeholderData: (prev) => prev },
  );

  const all = query.data ?? [];
  const cities = Array.from(new Set(all.map((u) => u.city).filter(Boolean))).sort();

  const filtered = all.filter((u) => (city === "ALL" ? true : u.city === city));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const setStatusMutation = useApiMutation(
    (vars: { id: string; status: "ACTIVE" | "SUSPENDED" }) => setUserStatus(vars.id, vars.status),
    {
      onSuccess: (_, vars) => {
        setConfirm(null);
        toast.success(
          vars.status === "ACTIVE" ? "Account reactivated" : "Account suspended",
          "The change takes effect on their next sign-in.",
        );
        query.refetch();
      },
      onError: (error) => toast.error("Could not update account", error.message),
    },
  );

  const remove = useApiMutation((id: string) => deleteUser(id), {
    onSuccess: () => {
      setConfirm(null);
      toast.success("Account removed");
      query.refetch();
    },
    onError: (error) => toast.error("Could not remove account", error.message),
  });

  const title = role === "WORKER" ? "Professionals" : "Customers";
  const baseHref = role === "WORKER" ? "/admin/workers" : "/admin/customers";

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={
          role === "WORKER"
            ? "Every professional on the platform, with verification and performance at a glance."
            : "Every registered customer, with booking history and account status."
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: title }]}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              if (filtered.length === 0) {
                toast.warning("Nothing to export", "No records match your filters.");
                return;
              }
              exportRowsToCsv(
                `${role === "WORKER" ? "professionals" : "customers"}.csv`,
                filtered.map((u) => ({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  phone: u.phone,
                  city: u.city,
                  status: u.status,
                  joined: u.joinedAt,
                })),
              );
              toast.success("Export ready", `${filtered.length} records downloaded as CSV.`);
            }}
            icon={<Download />}
          >
            Export CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email or phone…"
              icon={<Search />}
              className="flex-1"
              aria-label="Search accounts"
            />
            <Tabs
              value={status}
              onValueChange={(v) => {
                setStatus(v as typeof status);
                setPage(1);
              }}
            >
              <TabsList>
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="ACTIVE">Active</TabsTrigger>
                <TabsTrigger value="PENDING">Pending</TabsTrigger>
                <TabsTrigger value="SUSPENDED">Suspended</TabsTrigger>
              </TabsList>
            </Tabs>
            {cities.length > 1 && (
              <Tabs value={city} onValueChange={(v) => { setCity(v); setPage(1); }}>
                <TabsList className="flex-wrap">
                  <TabsTrigger value="ALL">All cities</TabsTrigger>
                  {cities.slice(0, 4).map((c) => (
                    <TabsTrigger key={c} value={c}>
                      {c}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <SectionLoader label={`Loading ${title.toLowerCase()}…`} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="search"
          title="No accounts found"
          description="Try a different search term or clear the filters."
          actionLabel="Clear filters"
          onAction={() => {
            setSearch("");
            setStatus("ALL");
            setCity("ALL");
          }}
        />
      ) : (
        <>
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[54rem] text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border text-left text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    {role === "WORKER" && <th className="px-4 py-3 font-medium">Category</th>}
                    {role === "WORKER" && <th className="px-4 py-3 font-medium">Rating</th>}
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id} className="hover:bg-accent/40 border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <AvatarCircle name={u.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{u.name}</p>
                            <p className="text-muted-foreground text-xs">{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="truncate text-[13px]">{u.email}</p>
                        <p className="text-muted-foreground text-xs">{u.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-[13px]">
                          <MapPin className="size-3.5 shrink-0" />
                          {u.area}, {u.city}
                        </span>
                        <p className="text-muted-foreground text-xs">Active {formatTimeAgo(u.lastActiveAt)}</p>
                      </td>
                      {role === "WORKER" && (
                        <td className="px-4 py-3">
                          <p className="text-[13px]">{u.categoryName ?? "—"}</p>
                          <p className="text-muted-foreground text-xs">{u.completedJobs ?? 0} jobs</p>
                        </td>
                      )}
                      {role === "WORKER" && (
                        <td className="px-4 py-3">
                          {u.rating ? (
                            <span className="flex items-center gap-1">
                              <RatingStars value={u.rating} size="xs" />
                              <span className="text-muted-foreground text-xs">{u.rating.toFixed(1)}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[13px]">No reviews</span>
                          )}
                        </td>
                      )}
                      <td className="text-muted-foreground px-4 py-3 text-[13px]">{formatDate(u.joinedAt)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[u.status] ?? "muted"}>{u.status}</Badge>
                        {u.verification && (
                          <Badge
                            variant={
                              u.verification === "APPROVED"
                                ? "success"
                                : u.verification === "REJECTED"
                                  ? "destructive"
                                  : "warning"
                            }
                            className="ml-1"
                          >
                            {u.verification}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {role === "WORKER" && (
                            <Button asChild variant="ghost" size="icon-sm" aria-label={`Verify ${u.name}`}>
                              <Link href={`/admin/verifications?worker=${u.id}`}>
                                <ShieldCheck />
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={u.status === "SUSPENDED" ? `Reactivate ${u.name}` : `Suspend ${u.name}`}
                            onClick={() =>
                              setConfirm({
                                id: u.id,
                                name: u.name,
                                action: u.status === "SUSPENDED" ? "activate" : "suspend",
                              })
                            }
                          >
                            {u.status === "SUSPENDED" ? <CheckCircle2 /> : <Ban />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${u.name}`}
                            onClick={() => setConfirm({ id: u.id, name: u.name, action: "delete" })}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-[13px]">
                Page {safePage} of {pages} · {filtered.length} records
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage === pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={
          confirm === null
            ? ""
            : confirm.action === "delete"
              ? `Remove ${confirm.name}?`
              : confirm.action === "suspend"
                ? `Suspend ${confirm.name}?`
                : `Reactivate ${confirm.name}?`
        }
        description={
          confirm?.action === "delete"
            ? "This removes the account and its access. Historical bookings are retained for reporting."
            : confirm?.action === "suspend"
              ? "The user is signed out and cannot book or accept jobs until reactivated."
              : "The user regains full access to the platform."
        }
        confirmLabel={confirm?.action === "delete" ? "Remove account" : confirm?.action === "suspend" ? "Suspend" : "Reactivate"}
        loading={setStatusMutation.isPending || remove.isPending}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.action === "delete") remove.mutate(confirm.id);
          else setStatusMutation.mutate({ id: confirm.id, status: confirm.action === "suspend" ? "SUSPENDED" : "ACTIVE" });
        }}
      >
        <p className="text-muted-foreground flex items-start gap-2 text-[13px]">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          {baseHref === "/admin/workers"
            ? "Suspension takes effect immediately and is recorded in the account status."
            : "All changes are recorded against the account for audit purposes."}
        </p>
      </ConfirmDialog>
    </div>
  );
}
