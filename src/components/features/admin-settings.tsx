"use client";

import * as React from "react";
import { RotateCcw, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SectionLoader } from "@/components/ui/states";
import { InfoBanner, PageHeader, SectionCard } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { DEFAULT_SETTINGS, getSettings, saveSettings } from "@/services/settings";
import { formatINR } from "@/lib/format";
import type { PlatformSettings } from "@/types";

export function AdminSettingsPage() {
  const toast = useToast();
  const query = useApiQuery(["settings", "platform"], () => getSettings());
  const [draft, setDraft] = React.useState<PlatformSettings | null>(null);
  const [hydratedFrom, setHydratedFrom] = React.useState<PlatformSettings | null>(null);
  const [resetOpen, setResetOpen] = React.useState(false);

  // Seed the draft the first time settings arrive, then leave it in the user's
  // hands so every keystroke is preserved.
  if (draft === null && query.data !== undefined) {
    setDraft(query.data);
    setHydratedFrom(query.data);
  }

  const persist = useApiMutation((next: PlatformSettings) => saveSettings(next), {
    onSuccess: (saved) => {
      setHydratedFrom(saved);
      toast.success("Settings saved", "Changes apply to the whole platform immediately.");
    },
    onError: (error) => toast.error("Could not save settings", error.message),
  });

  if (query.isLoading || !draft) return <SectionLoader label="Loading platform settings…" />;

  const set = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  const setNested = <K extends "notifications" | "security">(
    group: K,
    key: keyof PlatformSettings[K],
    value: boolean | number,
  ) =>
    setDraft((d) => (d ? { ...d, [group]: { ...d[group], [key]: value } } : d));

  const dirty = JSON.stringify(draft) !== JSON.stringify(hydratedFrom);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform settings"
        description="Commission, booking rules, notifications and account security."
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Settings" }]}
        actions={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(true)} icon={<RotateCcw />}>
              Restore defaults
            </Button>
            <Button
              disabled={!dirty}
              loading={persist.isPending}
              icon={<Save />}
              onClick={() => persist.mutate(draft)}
            >
              {dirty ? "Save changes" : "Saved"}
            </Button>
          </>
        }
      />

      {draft.maintenanceMode && (
        <InfoBanner
          variant="warning"
          title="Maintenance mode is on"
          description="Customers see a maintenance notice and cannot start new bookings until you turn it off."
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Brand" description="Shown in the header, emails and invoices.">
          <div className="space-y-3">
            <Field label="Platform name" htmlFor="set-name">
              <Input
                id="set-name"
                value={draft.platformName}
                onChange={(e) => set("platformName", e.target.value)}
              />
            </Field>
            <Field label="Tagline" htmlFor="set-tagline">
              <Input
                id="set-tagline"
                value={draft.tagline}
                onChange={(e) => set("tagline", e.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Support email" htmlFor="set-email">
                <Input
                  id="set-email"
                  type="email"
                  value={draft.supportEmail}
                  onChange={(e) => set("supportEmail", e.target.value)}
                />
              </Field>
              <Field label="Support phone" htmlFor="set-phone">
                <Input
                  id="set-phone"
                  value={draft.supportPhone}
                  onChange={(e) => set("supportPhone", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Money" description="Applied at checkout and on every payout.">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Commission (%)" htmlFor="set-commission">
                <Input
                  id="set-commission"
                  type="number"
                  min={0}
                  max={40}
                  value={draft.commissionPercent}
                  onChange={(e) => set("commissionPercent", Number(e.target.value))}
                />
              </Field>
              <Field label="GST (%)" htmlFor="set-gst">
                <Input
                  id="set-gst"
                  type="number"
                  min={0}
                  max={30}
                  value={draft.gstPercent}
                  onChange={(e) => set("gstPercent", Number(e.target.value))}
                />
              </Field>
            </div>
            <Field
              label="Minimum booking amount"
              htmlFor="set-min"
              hint={`Currently ${formatINR(draft.minBookingAmount)}`}
            >
              <Input
                id="set-min"
                type="number"
                min={0}
                value={draft.minBookingAmount}
                onChange={(e) => set("minBookingAmount", Number(e.target.value))}
              />
            </Field>
            <p className="text-muted-foreground text-[13px]">
              On a {formatINR(1000)} job you keep {formatINR(1000 * (1 - draft.commissionPercent / 100))} before
              GST.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Bookings" description="Rules applied to new requests.">
          <Toggle
            label="Auto-verify new professionals"
            description="Skip the manual verification queue for new sign-ups."
            checked={draft.autoVerifyWorkers}
            onChange={(v) => set("autoVerifyWorkers", v)}
          />
          <Toggle
            label="Maintenance mode"
            description="Pause new bookings while the platform is updated."
            checked={draft.maintenanceMode}
            onChange={(v) => set("maintenanceMode", v)}
          />
          <Field
            label="Booking window (days)"
            htmlFor="set-window"
            hint="How far ahead a customer can schedule"
          >
            <Input
              id="set-window"
              type="number"
              min={1}
              max={180}
              value={draft.bookingWindowDays}
              onChange={(e) => set("bookingWindowDays", Number(e.target.value))}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Notifications" description="What KaamWala sends automatically.">
          <Toggle
            label="Booking updates by email"
            checked={draft.notifications.emailBookingUpdates}
            onChange={(v) => setNested("notifications", "emailBookingUpdates", v)}
          />
          <Toggle
            label="Promotional emails"
            description="Offers and new services in your city."
            checked={draft.notifications.emailPromotions}
            onChange={(v) => setNested("notifications", "emailPromotions", v)}
          />
          <Toggle
            label="Booking SMS"
            checked={draft.notifications.smsBookingUpdates}
            onChange={(v) => setNested("notifications", "smsBookingUpdates", v)}
          />
          <Toggle
            label="In-app push"
            checked={draft.notifications.pushEnabled}
            onChange={(v) => setNested("notifications", "pushEnabled", v)}
          />
        </SectionCard>

        <SectionCard title="Security" description="Applies to every account on the platform." icon={<ShieldCheck />}>
          <Toggle
            label="Require two-factor authentication for admins"
            checked={draft.security.twoFactor}
            onChange={(v) => setNested("security", "twoFactor", v)}
          />
          <Field label="Session timeout (minutes)" htmlFor="set-timeout">
            <Input
              id="set-timeout"
              type="number"
              min={5}
              max={1440}
              value={draft.security.sessionTimeoutMinutes}
              onChange={(e) => setNested("security", "sessionTimeoutMinutes", Number(e.target.value))}
            />
          </Field>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Restore default settings?"
        description="Every platform setting returns to its shipped default. This cannot be undone."
        confirmLabel="Restore defaults"
        variant="destructive"
        loading={persist.isPending}
        onConfirm={() => {
          setResetOpen(false);
          setDraft(DEFAULT_SETTINGS);
          setHydratedFrom(DEFAULT_SETTINGS);
          persist.mutate(DEFAULT_SETTINGS);
        }}
      >
        <p className="text-muted-foreground text-sm">
          Your current commission, GST and booking rules will be replaced immediately.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-muted-foreground text-[13px]">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
