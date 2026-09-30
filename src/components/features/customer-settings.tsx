"use client";

import * as React from "react";
import { Bell, Globe, Laptop, Monitor, Moon, RotateCcw, Save, Sun, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem, RadioGroupLabel } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader, SectionCard } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useTheme } from "@/components/providers/theme-provider";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PREFERENCES,
  readPreferences,
  resetPreferences,
  writePreferences,
  type DateFormat,
  type Density,
  type Language,
  type TimeFormat,
  type UserPreferences,
} from "@/lib/preferences";

export function CustomerSettingsPage({ homeHref = "/customer/dashboard" }: { homeHref?: string } = {}) {
  const toast = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [prefs, setPrefs] = React.useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const mounted = useMounted();

  // Preferences live in localStorage. Reading them only after mount keeps the
  // server markup identical to the first client render.
  if (mounted && !hydrated) {
    setHydrated(true);
    const stored = readPreferences();
    if (stored !== prefs) setPrefs(stored);
  }

  const patch = (next: Partial<UserPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...next }));
    setDirty(true);
  };
  const patchNotifications = (next: Partial<UserPreferences["notifications"]>) => {
    setPrefs((prev) => ({ ...prev, notifications: { ...prev.notifications, ...next } }));
    setDirty(true);
  };
  const patchQuiet = (next: Partial<UserPreferences["quietHours"]>) => {
    setPrefs((prev) => ({ ...prev, quietHours: { ...prev.quietHours, ...next } }));
    setDirty(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Tune how KaamWala looks and how we contact you."
        breadcrumbs={[{ label: "Account", href: homeHref }, { label: "Settings" }]}
        actions={
          <>
            <Button variant="outline" onClick={() => setConfirmReset(true)} icon={<RotateCcw />}>
              Reset to defaults
            </Button>
            <Button
              onClick={() => {
                writePreferences(prefs);
                setDirty(false);
                toast.success("Settings saved", "Your preferences apply immediately.");
              }}
              disabled={!dirty}
              icon={<Save />}
            >
              Save preferences
            </Button>
          </>
        }
      />

      <SectionCard
        title="Appearance"
        description="Applies on this device and is remembered next time you visit."
        icon={resolvedTheme === "dark" ? <Moon /> : <Sun />}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  aria-pressed={theme === option.value}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition",
                    theme === option.value
                      ? "border-brand bg-brand-soft text-brand-soft-foreground"
                      : "border-border hover:border-brand/40",
                  )}
                >
                  <option.icon className="size-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Layout density</Label>
            <RadioGroup
              value={prefs.density}
              onValueChange={(v) => patch({ density: v as Density })}
              className="flex flex-wrap gap-4"
            >
              {(["comfortable", "compact"] as Density[]).map((value) => (
                <div key={value} className="flex items-center gap-2">
                  <RadioGroupItem value={value} id={`density-${value}`} />
                  <RadioGroupLabel htmlFor={`density-${value}`} className="capitalize">
                    {value}
                  </RadioGroupLabel>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-language">Language</Label>
              <Select value={prefs.language} onValueChange={(v) => patch({ language: v as Language })}>
                <SelectTrigger id="s-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी</SelectItem>
                  <SelectItem value="mr">मराठी</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-date">Date format</Label>
              <Select value={prefs.dateFormat} onValueChange={(v) => patch({ dateFormat: v as DateFormat })}>
                <SelectTrigger id="s-date">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd-mmm-yyyy">25 Sep 2026</SelectItem>
                  <SelectItem value="dd-mm-yyyy">25-09-2026</SelectItem>
                  <SelectItem value="yyyy-mm-dd">2026-09-25</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-time">Time format</Label>
              <Select value={prefs.timeFormat} onValueChange={(v) => patch({ timeFormat: v as TimeFormat })}>
                <SelectTrigger id="s-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">10:30 AM</SelectItem>
                  <SelectItem value="24h">10:30</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-muted-foreground flex items-center gap-1.5 text-[13px]">
            <Laptop className="size-3.5" />
            Language selection is stored locally; the demo ships English copy only.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Notifications"
        description="Choose how KaamWala keeps you updated about bookings."
        icon={<Bell />}
      >
        <div className="space-y-4">
          <ToggleRow
            label="Booking updates by email"
            description="Confirmations, reschedules and cancellations."
            checked={prefs.notifications.emailBookingUpdates}
            onChange={(v) => patchNotifications({ emailBookingUpdates: v })}
          />
          <ToggleRow
            label="Booking updates by SMS"
            description="Quick alerts when a professional is on the way."
            checked={prefs.notifications.smsBookingUpdates}
            onChange={(v) => patchNotifications({ smsBookingUpdates: v })}
          />
          <ToggleRow
            label="In-app booking alerts"
            description="Real-time status changes inside KaamWala."
            checked={prefs.notifications.pushBookingUpdates}
            onChange={(v) => patchNotifications({ pushBookingUpdates: v })}
          />
          <ToggleRow
            label="Offers and promotions"
            description="Seasonal discounts and new service launches."
            checked={prefs.notifications.emailPromotions}
            onChange={(v) => patchNotifications({ emailPromotions: v })}
          />
          <ToggleRow
            label="In-app promotional alerts"
            description="Recommendations matched to your booking history."
            checked={prefs.notifications.pushPromotions}
            onChange={(v) => patchNotifications({ pushPromotions: v })}
          />

          <div className="border-border space-y-3 rounded-xl border p-4">
            <ToggleRow
              label="Quiet hours"
              description="Pause non-urgent alerts during the hours you set."
              checked={prefs.quietHours.enabled}
              onChange={(v) => patchQuiet({ enabled: v })}
            />
            {prefs.quietHours.enabled && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="q-from">From</Label>
                  <Input
                    id="q-from"
                    type="time"
                    value={prefs.quietHours.from}
                    onChange={(e) => patchQuiet({ from: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="q-to">To</Label>
                  <Input
                    id="q-to"
                    type="time"
                    value={prefs.quietHours.to}
                    onChange={(e) => patchQuiet({ to: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Bookings & payments"
        description="Small defaults that make checkout faster."
        icon={<Wallet />}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-payment">Default payment method</Label>
            <Select
              value={prefs.defaultPaymentMethod}
              onValueChange={(v) => patch({ defaultPaymentMethod: v as UserPreferences["defaultPaymentMethod"] })}
            >
              <SelectTrigger id="s-payment" className="sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="CASH">Cash on visit</SelectItem>
                <SelectItem value="WALLET">KaamWala wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ToggleRow
            label="Remember my payment method"
            description="Keeps the selection above highlighted at the payment step."
            checked={prefs.defaultPaymentMethod !== "CASH"}
            onChange={(v) => {
              if (!v) patch({ defaultPaymentMethod: "CASH" });
            }}
            disabled={prefs.defaultPaymentMethod === "CASH"}
          />
          <ToggleRow
            label="Low wallet balance reminders"
            description="Ask me to top up before a booking needs wallet credit."
            checked={prefs.walletTopUpReminders}
            onChange={(v) => patch({ walletTopUpReminders: v })}
          />
          <ToggleRow
            label="Auto-confirm visit requests"
            description="Skip the confirmation step when a professional accepts a visit request."
            checked={prefs.autoConfirmBookings}
            onChange={(v) => patch({ autoConfirmBookings: v })}
          />
          <ToggleRow
            label="Share my location during visits"
            description="Lets the professional navigate to the job address."
            checked={prefs.shareBookingLocation}
            onChange={(v) => patch({ shareBookingLocation: v })}
          />
        </div>
      </SectionCard>

      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Globe className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <p className="text-muted-foreground text-[13px] leading-relaxed">
              Preferences are stored on this device only. Booking history, payment records and documents are never
              affected by a reset.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={!dirty}
            onClick={() => {
              setPrefs(readPreferences());
              setDirty(false);
              toast.info("Unsaved changes discarded");
            }}
          >
            Discard changes
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset all preferences?"
        description="Appearance, notification and booking defaults return to the KaamWala defaults."
        confirmLabel="Reset preferences"
        onConfirm={() => {
          const next = resetPreferences();
          setPrefs(next);
          setDirty(false);
          setConfirmReset(false);
          toast.success("Preferences reset");
        }}
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const id = React.useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        <p className="text-muted-foreground mt-0.5 text-[13px]">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
