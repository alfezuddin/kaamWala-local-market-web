"use client";

import * as React from "react";
import { Camera, FileCheck2, Languages, Save, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import { RatingStars } from "@/components/ui/rating-stars";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SectionLoader } from "@/components/ui/states";
import { InfoBanner, PageHeader, SectionCard } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { getWorkerDashboard, submitWorkerVerification, updateWorker, uploadWorkerDocument } from "@/services/workers";
import { maskValue } from "@/lib/format";
import type { Worker, WorkerDocument } from "@/types";

const DOC_LABELS: Record<WorkerDocument["type"], string> = {
  AADHAAR: "Aadhaar card",
  PAN: "PAN card",
  VOTER_ID: "Voter ID",
  ADDRESS_PROOF: "Address proof",
  PHOTO: "Profile photo",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "info"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "destructive",
};

export function WorkerProfilePage() {
  const toast = useToast();
  const { session } = useAuth();
  const userId = session?.userId;
  const dbVersion = useDbVersion();

  const [form, setForm] = React.useState<Worker | null>(null);
  const [skillDraft, setSkillDraft] = React.useState("");
  const [areaDraft, setAreaDraft] = React.useState("");
  const [docOpen, setDocOpen] = React.useState(false);
  const [docType, setDocType] = React.useState<WorkerDocument["type"]>("AADHAAR");
  const [docNumber, setDocNumber] = React.useState("");
  const [submitOpen, setSubmitOpen] = React.useState(false);

  const query = useApiQuery(
    ["worker", "dashboard", userId, dbVersion],
    () => (userId ? getWorkerDashboard(userId) : Promise.resolve(null)),
    { enabled: Boolean(userId) },
  );

  const worker = query.data?.worker ?? null;
  const [lastWorker, setLastWorker] = React.useState<typeof worker>(null);
  if (worker && worker !== lastWorker) {
    setLastWorker(worker);
    setForm(worker);
  }

  const save = useApiMutation(
    () =>
      updateWorker(userId ?? "", {
        name: form!.name.trim(),
        phone: form!.phone.trim(),
        email: form!.email.trim(),
        headline: form!.headline.trim(),
        about: form!.about.trim(),
        city: form!.city.trim(),
        area: form!.area.trim(),
        pincode: form!.pincode.trim(),
        address: form!.address.trim(),
        experienceYears: form!.experienceYears,
        skills: form!.skills,
        areas: form!.areas,
        languages: form!.languages,
      }),
    {
      onSuccess: () => {
        toast.success("Profile updated", "Customers can now see your latest details.");
        query.refetch();
      },
      onError: (error) => toast.error("Could not save profile", error.message),
    },
  );

  const upload = useApiMutation(
    (vars: { type: WorkerDocument["type"]; number: string }) =>
      uploadWorkerDocument(userId ?? "", vars),
    {
      onSuccess: () => {
        setDocOpen(false);
        setDocNumber("");
        toast.success("Document uploaded", "Our team will review it within 2 working days.");
        query.refetch();
      },
      onError: (error) => toast.error("Could not upload document", error.message),
    },
  );

  const submitVerification = useApiMutation(() => submitWorkerVerification(userId ?? ""), {
    onSuccess: () => {
      setSubmitOpen(false);
      toast.success("Submitted for verification", "We will notify you once it is approved.");
      query.refetch();
    },
    onError: (error) => toast.error("Could not submit for verification", error.message),
  });

  if (query.isLoading || !form) return <SectionLoader label="Loading your profile…" />;

  const approvedDocs = form.documents.filter((d) => d.status === "APPROVED").length;
  const canSubmit = form.documents.length > 0 && form.verification !== "APPROVED";

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        description="This is what customers see when they book you."
        breadcrumbs={[{ label: "Professional", href: "/worker/dashboard" }, { label: "Profile" }]}
        actions={
          <Button onClick={() => save.mutate()} loading={save.isPending} icon={<Save />}>
            Save profile
          </Button>
        }
      />

      {form.verification !== "APPROVED" && (
        <InfoBanner
          variant={form.verification === "REJECTED" ? "warning" : "info"}
          icon={<ShieldCheck />}
          title={
            form.verification === "REJECTED"
              ? "Your verification was not approved"
              : "You are not verified yet"
          }
          description={
            form.verification === "REJECTED"
              ? (form.rejectionReason ?? "Check the document statuses below and resubmit.")
              : `${approvedDocs} of ${form.documents.length} documents approved. Verified professionals appear higher in search results.`
          }
          action={
            canSubmit ? (
              <Button size="sm" onClick={() => setSubmitOpen(true)}>
                Submit for verification
              </Button>
            ) : undefined
          }
        />
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-fit">
            <AvatarCircle name={form.name} size="xl" online={form.isOnline ?? true} />
            <button
              type="button"
              onClick={() => {
                setDocType("PHOTO");
                setDocNumber("");
                setDocOpen(true);
              }}
              className="bg-background text-muted-foreground absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border shadow-soft transition hover:text-brand"
              aria-label="Change profile photo"
            >
              <Camera className="size-4" />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">{form.name}</h2>
              <Badge variant={STATUS_VARIANT[form.verification]}>{form.verification}</Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">{form.headline}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <RatingStars value={form.rating} size="sm" />
                <span className="text-muted-foreground text-xs">
                  {form.rating.toFixed(1)} ({form.reviewCount} reviews)
                </span>
              </span>
              <span className="text-muted-foreground text-xs">
                {form.completedJobs} jobs · {form.experienceYears} yrs experience
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <SectionCard
        title="About you"
        description="A clear introduction helps customers choose confidently."
        icon={<Sparkles />}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="w-name">Full name</Label>
            <Input id="w-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-headline">Headline</Label>
            <Input
              id="w-headline"
              value={form.headline}
              maxLength={80}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="e.g. Certified electrician with 8 years of experience"
            />
            <p className="text-muted-foreground text-xs">{form.headline.length}/80 characters</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-about">About</Label>
            <Textarea
              id="w-about"
              rows={4}
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
              placeholder="Describe your experience, the tools you use and the kind of jobs you take on."
            />
            <p className="text-muted-foreground text-xs">{form.about.length}/600 characters</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="w-exp">Experience (years)</Label>
              <Input
                id="w-exp"
                type="number"
                min={0}
                max={60}
                value={form.experienceYears}
                onChange={(e) =>
                  setForm({ ...form, experienceYears: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-phone">Phone</Label>
              <Input
                id="w-phone"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-email">Email</Label>
              <Input
                id="w-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Skills & service areas"
        description="Customers filter professionals using these fields."
        icon={<Sparkles />}
      >
        <div className="space-y-4">
          <TagEditor
            label="Skills"
            tags={form.skills}
            draft={skillDraft}
            placeholder="e.g. Wiring, DB repair, CCTV"
            onDraftChange={setSkillDraft}
            onAdd={(tag) => {
              setForm({ ...form, skills: [...form.skills, tag] });
              setSkillDraft("");
            }}
            onRemove={(tag) => setForm({ ...form, skills: form.skills.filter((s) => s !== tag) })}
          />
          <TagEditor
            label="Service areas"
            tags={form.areas}
            draft={areaDraft}
            placeholder="e.g. Andheri, Bandra"
            onDraftChange={setAreaDraft}
            onAdd={(tag) => {
              setForm({ ...form, areas: [...form.areas, tag] });
              setAreaDraft("");
            }}
            onRemove={(tag) => setForm({ ...form, areas: form.areas.filter((s) => s !== tag) })}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Address & languages"
        description="Used to match you with nearby jobs and to communicate on site."
        icon={<Languages />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="w-address">Address</Label>
            <Input
              id="w-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-area">Area</Label>
            <Input id="w-area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-city">City</Label>
            <Input id="w-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-pincode">PIN code</Label>
            <Input
              id="w-pincode"
              inputMode="numeric"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Languages you speak</Label>
            <div className="flex flex-wrap gap-2">
              {["Hindi", "English", "Marathi", "Gujarati", "Tamil", "Telugu", "Bengali", "Punjabi"].map(
                (lang) => {
                  const active = form.languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          languages: active
                            ? form.languages.filter((l) => l !== lang)
                            : [...form.languages, lang],
                        })
                      }
                      aria-pressed={active}
                      className={
                        active
                          ? "rounded-full border border-brand bg-brand-soft px-3 py-1.5 text-[13px] text-brand-soft-foreground"
                          : "rounded-full border border-border px-3 py-1.5 text-[13px] transition hover:border-brand/40"
                      }
                    >
                      {lang}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Verification documents"
        description="Documents are reviewed manually and masked in your dashboard."
        icon={<FileCheck2 />}
        action={
          <Button variant="outline" size="sm" onClick={() => setDocOpen(true)} icon={<Upload />}>
            Add document
          </Button>
        }
      >
        {form.documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No documents uploaded yet. Add an Aadhaar and PAN to get verified.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {form.documents.map((doc) => (
              <li key={doc.id} className="border-border rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{DOC_LABELS[doc.type]}</p>
                    <p className="text-muted-foreground text-[13px]">
                      {doc.type === "PHOTO" ? "Profile photo" : maskValue(doc.number)}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[doc.status]}>{doc.status}</Badge>
                </div>
                {doc.rejectionReason && (
                  <p className="text-destructive mt-1.5 text-[13px]">{doc.rejectionReason}</p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  Uploaded {new Date(doc.uploadedAt).toLocaleDateString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <ConfirmDialog
        open={docOpen}
        onOpenChange={setDocOpen}
        title="Add a verification document"
        description="Enter the document number exactly as printed. It is stored on this device in the demo build."
        confirmLabel="Upload document"
        loading={upload.isPending}
        onConfirm={() => {
          if (docType !== "PHOTO" && docNumber.trim().length < 4) {
            toast.warning("Enter the document number", "It must be at least 4 characters.");
            return;
          }
          upload.mutate({ type: docType, number: docNumber.trim() || "PROFILE-PHOTO" });
        }}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Document type</Label>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {(Object.keys(DOC_LABELS) as WorkerDocument["type"][]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDocType(type)}
                  aria-pressed={docType === type}
                  className={
                    docType === type
                      ? "rounded-lg border border-brand bg-brand-soft px-3 py-2 text-left text-[13px] text-brand-soft-foreground"
                      : "rounded-lg border border-border px-3 py-2 text-left text-[13px] transition hover:border-brand/40"
                  }
                >
                  {DOC_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
          {docType !== "PHOTO" && (
            <div className="space-y-1.5">
              <Label htmlFor="doc-number">Document number</Label>
              <Input
                id="doc-number"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                placeholder="e.g. XXXX XXXX 1234"
              />
            </div>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="Submit for verification?"
        description="Our team reviews your documents, usually within 2 working days."
        confirmLabel="Submit"
        loading={submitVerification.isPending}
        onConfirm={() => submitVerification.mutate()}
      />
    </div>
  );
}

function TagEditor({
  label,
  tags,
  draft,
  placeholder,
  onDraftChange,
  onAdd,
  onRemove,
}: {
  label: string;
  tags: string[];
  draft: string;
  placeholder: string;
  onDraftChange: (v: string) => void;
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`tag-${label}`}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={`tag-${label}`}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const value = draft.trim();
              if (value && !tags.includes(value)) onAdd(value);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!draft.trim() || tags.includes(draft.trim())}
          onClick={() => onAdd(draft.trim())}
        >
          Add
        </Button>
      </div>
      {tags.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag}>
              <span className="bg-muted text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px]">
                {tag}
                <button
                  type="button"
                  onClick={() => onRemove(tag)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">Nothing added yet.</p>
      )}
    </div>
  );
}
