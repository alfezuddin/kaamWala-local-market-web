"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, FileText, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, SectionLoader } from "@/components/ui/states";
import { InfoBanner, PageHeader } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { getPendingVerifications, getWorkerVerification, setWorkerVerification } from "@/services/admin";
import { formatDate, maskValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VerificationStatus, WorkerDocument } from "@/types";

const DOC_LABELS: Record<WorkerDocument["type"], string> = {
  AADHAAR: "Aadhaar",
  PAN: "PAN",
  VOTER_ID: "Voter ID",
  ADDRESS_PROOF: "Address proof",
  PHOTO: "Photo",
};

export function AdminVerificationsPage() {
  const params = useSearchParams();
  const toast = useToast();
  const dbVersion = useDbVersion();
  const [selectedId, setSelectedId] = React.useState<string | null>(params.get("worker"));
  const [decision, setDecision] = React.useState<VerificationStatus | null>(null);
  const [reason, setReason] = React.useState("");

  const listQuery = useApiQuery(["admin", "verifications", dbVersion], () => getPendingVerifications());

  const detailQuery = useApiQuery(
    ["admin", "verification", selectedId, dbVersion],
    () => (selectedId ? getWorkerVerification(selectedId) : Promise.resolve(null)),
    { enabled: Boolean(selectedId) },
  );

  const decide = useApiMutation(
    (vars: { id: string; status: VerificationStatus; reason?: string }) =>
      setWorkerVerification(vars.id, vars.status, vars.reason),
    {
      onSuccess: (_, vars) => {
        setDecision(null);
        setReason("");
        toast.success(
          vars.status === "APPROVED" ? "Professional approved" : "Verification rejected",
          vars.status === "APPROVED"
            ? "They can now receive priority job requests."
            : "The professional has been notified with your reason.",
        );
        listQuery.refetch();
        detailQuery.refetch();
        if (vars.status === "APPROVED") setSelectedId(null);
      },
      onError: (error) => toast.error("Could not update verification", error.message),
    },
  );

  const pending = listQuery.data ?? [];
  const detail = detailQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifications"
        description="Review professional documents before they appear higher in search."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Verifications" }]}
      />

      {listQuery.isLoading ? (
        <SectionLoader label="Loading verification queue…" />
      ) : pending.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="Nothing pending"
          description="Every professional application has been reviewed. New submissions appear here automatically."
          actionLabel="View all professionals"
          actionHref="/admin/workers"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Queue ({pending.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedId(w.id)}
                  aria-pressed={selectedId === w.id}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition",
                    selectedId === w.id ? "border-brand bg-brand-soft/50" : "border-border hover:border-brand/40",
                  )}
                >
                  <AvatarCircle name={w.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{w.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {w.headline} · {formatDate(w.joinedAt)}
                    </p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {!selectedId ? (
            <Card>
              <CardContent className="flex min-h-72 items-center justify-center">
                <EmptyState
                  icon="inbox"
                  title="Select an application"
                  description="Pick a professional from the queue to review their documents."
                />
              </CardContent>
            </Card>
          ) : detailQuery.isLoading ? (
            <SectionLoader label="Loading application…" />
          ) : !detail ? (
            <Card>
              <CardContent className="flex min-h-72 items-center justify-center">
                <EmptyState
                  icon="search"
                  title="Application not found"
                  description="This professional may have been removed."
                  actionLabel="Back to queue"
                  onAction={() => setSelectedId(null)}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <AvatarCircle name={detail.worker.name} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{detail.worker.name}</p>
                      <p className="text-muted-foreground text-[13px]">{detail.worker.email}</p>
                      <p className="text-muted-foreground text-[13px]">
                        {detail.category?.name ?? "Uncategorised"} · {detail.worker.experienceYears} yrs ·{" "}
                        {detail.worker.area}, {detail.worker.city}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDecision("REJECTED")}
                      icon={<XCircle />}
                    >
                      Reject
                    </Button>
                    <Button onClick={() => setDecision("APPROVED")} icon={<CheckCircle2 />}>
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {detail.worker.documents.length === 0 ? (
                    <EmptyState
                      compact
                      icon="alert"
                      title="No documents uploaded"
                      description="This professional cannot be verified without identity documents."
                    />
                  ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {detail.worker.documents.map((doc) => (
                        <li key={doc.id} className="border-border rounded-xl border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                              <div>
                                <p className="text-sm font-medium">{DOC_LABELS[doc.type]}</p>
                                <p className="text-muted-foreground text-[13px]">
                                  {doc.type === "PHOTO" ? "Profile photo" : maskValue(doc.number)}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={doc.status === "APPROVED" ? "success" : doc.status === "REJECTED" ? "destructive" : "warning"}
                            >
                              {doc.status}
                            </Badge>
                          </div>
                          {doc.rejectionReason && (
                            <p className="text-destructive mt-1.5 text-[13px]">{doc.rejectionReason}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">About</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-[13px]">
                    <p className="leading-relaxed">{detail.worker.about}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {detail.worker.skills.map((s) => (
                        <Badge key={s} variant="outline" size="sm">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Track record</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-3 text-[13px]">
                      <Stat label="Jobs completed" value={String(detail.worker.completedJobs)} />
                      <Stat label="Jobs cancelled" value={String(detail.worker.cancelledJobs)} />
                      <Stat label="Services offered" value={String(detail.services.length)} />
                      <Stat label="Reviews" value={String(detail.reviews.length)} />
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      <InfoBanner
        variant="info"
        icon={<ShieldCheck />}
        title="Document numbers are masked"
        description="Only the last four characters are shown. Full numbers are never rendered in the admin console."
      />

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(v) => !v && setDecision(null)}
        title={decision === "APPROVED" ? "Approve this professional?" : "Reject this application?"}
        description={
          decision === "APPROVED"
            ? "They will be marked verified and shown higher in customer search results."
            : "A reason is required so the professional knows what to fix."
        }
        confirmLabel={decision === "APPROVED" ? "Approve" : "Reject application"}
        loading={decide.isPending}
        onConfirm={() => {
          if (!decision || !detail) return;
          if (decision === "REJECTED" && reason.trim().length < 10) {
            toast.warning("Add a reason", "Give at least 10 characters of guidance.");
            return;
          }
          decide.mutate({
            id: detail.worker.id,
            status: decision,
            reason: decision === "REJECTED" ? reason.trim() : undefined,
          });
        }}
      >
        {decision === "REJECTED" && (
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Reason for rejection</Label>
            <Textarea
              id="reject-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. The Aadhaar number does not match the name on your PAN."
            />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs uppercase">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
