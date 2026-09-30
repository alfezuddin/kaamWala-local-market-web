"use client";

import * as React from "react";
import { CalendarOff, Clock, Save, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SectionLoader } from "@/components/ui/states";
import { InfoBanner, PageHeader, SectionCard } from "@/components/ui/dashboard-shell";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import { useDbVersion } from "@/hooks/use-mounted";
import { getWorkerDashboard, updateAvailability } from "@/services/workers";
import { addDaysISO, formatDate, toDateKey, todayKey } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WeeklyAvailability } from "@/types";

const DAYS = [
  { day: 1, label: "Monday" },
  { day: 2, label: "Tuesday" },
  { day: 3, label: "Wednesday" },
  { day: 4, label: "Thursday" },
  { day: 5, label: "Friday" },
  { day: 6, label: "Saturday" },
  { day: 0, label: "Sunday" },
];

function defaultAvailability(): WeeklyAvailability[] {
  return DAYS.map(({ day }) => ({
    day,
    enabled: day !== 0,
    start: day === 6 ? "10:00" : "09:00",
    end: day === 6 ? "17:00" : "19:00",
  }));
}

export function WorkerAvailabilityPage() {
  const toast = useToast();
  const { session } = useAuth();
  const userId = session?.userId;
  const dbVersion = useDbVersion();

  const [weekly, setWeekly] = React.useState<WeeklyAvailability[]>(defaultAvailability);
  const [blocked, setBlocked] = React.useState<string[]>([]);
  const [emergency, setEmergency] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [clearOpen, setClearOpen] = React.useState(false);

  const query = useApiQuery(
    ["worker", "dashboard", userId, dbVersion],
    () => (userId ? getWorkerDashboard(userId) : Promise.resolve(null)),
    { enabled: Boolean(userId) },
  );

  // Hydrate the schedule once the dashboard loads, then leave the draft in the
  // worker's hands.
  const worker = query.data?.worker ?? null;
  const [lastWorker, setLastWorker] = React.useState<typeof worker>(null);
  if (worker && worker !== lastWorker) {
    setLastWorker(worker);
    setWeekly(
      DAYS.map(({ day }) =>
        worker.availability.find((a) => a.day === day) ?? {
          day,
          enabled: false,
          start: "09:00",
          end: "19:00",
        },
      ),
    );
    setBlocked(worker.blockedDates);
    setEmergency(worker.emergencyAvailable);
    setDirty(false);
  }

  const save = useApiMutation(
    () => updateAvailability(userId ?? "", weekly, blocked, emergency),
    {
      onSuccess: () => {
        setDirty(false);
        toast.success("Availability saved", "Customers will only see you in these slots.");
        query.refetch();
      },
      onError: (error) => toast.error("Could not save availability", error.message),
    },
  );

  if (query.isLoading) return <SectionLoader label="Loading your availability…" />;

  const enabledCount = weekly.filter((d) => d.enabled).length;
  const upcoming = Array.from({ length: 14 }, (_, i) => addDaysISO(i));
  const today = todayKey();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Availability"
        description="Set the hours you work and the days you are unavailable."
        breadcrumbs={[{ label: "Professional", href: "/worker/dashboard" }, { label: "Availability" }]}
        actions={
          <Button
            onClick={() => save.mutate()}
            loading={save.isPending}
            disabled={!dirty}
            icon={<Save />}
          >
            Save availability
          </Button>
        }
      />

      <InfoBanner
        variant="info"
        icon={<Clock />}
        title={`You are bookable ${enabledCount} day${enabledCount === 1 ? "" : "s"} a week`}
        description="Requests outside your working hours can still arrive as visit requests. Accepting one confirms that slot with the customer."
      />

      <SectionCard
        title="Weekly working hours"
        description="Set the window customers can book you in."
        icon={<Clock />}
      >
        <ul className="space-y-3">
          {DAYS.map(({ day, label }, index) => {
            const slot = weekly.find((d) => d.day === day) ?? {
              day,
              enabled: false,
              start: "09:00",
              end: "19:00",
            };
            return (
              <li
                key={day}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between",
                  slot.enabled ? "border-border" : "border-dashed border-border/70",
                )}
              >
                <div className="flex items-center gap-3">
                  <Switch
                    id={`day-${day}`}
                    checked={slot.enabled}
                    onCheckedChange={(v) => {
                      setWeekly(
                        weekly.map((d) => (d.day === day ? { ...d, enabled: v } : d)),
                      );
                      setDirty(true);
                    }}
                    aria-label={`Enable ${label}`}
                  />
                  <Label htmlFor={`day-${day}`} className={slot.enabled ? "" : "text-muted-foreground"}>
                    {label}
                  </Label>
                  {!slot.enabled && (
                    <Badge variant="muted" size="sm">
                      Off
                    </Badge>
                  )}
                </div>
                {slot.enabled ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.start}
                      aria-label={`${label} start time`}
                      onChange={(e) => {
                        setWeekly(
                          weekly.map((d) => (d.day === day ? { ...d, start: e.target.value } : d)),
                        );
                        setDirty(true);
                      }}
                      className="w-32"
                    />
                    <span className="text-muted-foreground text-[13px]">to</span>
                    <Input
                      type="time"
                      value={slot.end}
                      aria-label={`${label} end time`}
                      onChange={(e) => {
                        setWeekly(
                          weekly.map((d) => (d.day === day ? { ...d, end: e.target.value } : d)),
                        );
                        setDirty(true);
                      }}
                      className="w-32"
                    />
                    {index === 0 && slot.start > slot.end && (
                      <Badge variant="destructive" size="sm">
                        End before start
                      </Badge>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard
        title="Unavailable dates"
        description="Block out holidays or personal commitments for the next two weeks."
        icon={<CalendarOff />}
        action={
          blocked.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => setClearOpen(true)}>
              Clear all
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-wrap gap-2">
          {upcoming.map((iso) => {
            const date = toDateKey(iso);
            const isBlocked = blocked.includes(date);
            const isToday = date === today;
            return (
              <button
                key={date}
                type="button"
                onClick={() => {
                  setBlocked((prev) =>
                    prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
                  );
                  setDirty(true);
                }}
                aria-pressed={isBlocked}
                className={cn(
                  "min-w-20 rounded-xl border px-3 py-2 text-center transition",
                  isBlocked
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border hover:border-brand/40",
                )}
              >
                <span className="block text-[11px] uppercase tracking-wide opacity-70">
                  {new Date(date).toLocaleDateString("en-IN", { weekday: "short" })}
                </span>
                <span className="block text-sm font-medium">
                  {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                {isToday && <span className="text-brand block text-[10px]">Today</span>}
              </button>
            );
          })}
        </div>
        {blocked.length > 0 && (
          <p className="text-muted-foreground mt-3 text-[13px]">
            {blocked.length} day{blocked.length === 1 ? "" : "s"} blocked, starting{" "}
            {formatDate(blocked[0])}.
          </p>
        )}
      </SectionCard>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="text-warning size-4" />
            Emergency availability
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-start justify-between gap-4">
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            Turn this on to appear in urgent same-day requests. Your working hours above still apply.
          </p>
          <Switch
            checked={emergency}
            onCheckedChange={(v) => {
              setEmergency(v);
              setDirty(true);
            }}
            aria-label="Emergency availability"
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear all blocked dates?"
        description="You will be bookable on every day of the next two weeks."
        confirmLabel="Clear dates"
        onConfirm={() => {
          setBlocked([]);
          setDirty(true);
          setClearOpen(false);
        }}
      />
    </div>
  );
}
