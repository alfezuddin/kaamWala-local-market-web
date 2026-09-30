"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Mail, Phone, User, Wrench } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { AppLogo } from "@/components/ui/app-logo";
import { useToast } from "@/components/ui/toaster";
import { useApiQuery } from "@/hooks/use-api";
import { getCategories } from "@/services/catalog";
import { homePathForRole } from "@/services/auth";
import { CITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const schema = z.object({
  role: z.enum(["CUSTOMER", "WORKER"]),
  name: z.string().min(2, "Enter your full name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: z.string().min(8, "Use at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm your password"),
  city: z.string().min(1, "Select your city"),
  categoryId: z.string().optional(),
  terms: z.literal(true, { message: "You must accept the terms to continue" }),
}).refine((v) => v.password === v.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type Values = z.infer<typeof schema>;

const STEPS_CUSTOMER = ["Your details", "Where you are", "You're in"];
const STEPS_WORKER = ["Your details", "Your trade", "You're in"];

export function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const initialRole = (params.get("role") as Role) === "WORKER" ? "WORKER" : "CUSTOMER";

  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const categoriesQuery = useApiQuery(["services", "categories"], () => getCategories(), { staleTime: 5 * 60_000 });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      role: initialRole,
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      city: "Indore",
      categoryId: "",
      terms: false as unknown as true,
    },
  });

  const { register, setValue, trigger, formState } = form;
  const values = useWatch({ control: form.control });
  const isWorker = values.role === "WORKER";
  const steps = isWorker ? STEPS_WORKER : STEPS_CUSTOMER;
  const lastStep = steps.length - 1;

  const fieldForStep = (index: number) => {
    if (index === 0) return ["name", "email", "phone", "password", "confirmPassword"] as const;
    if (!isWorker) return ["city", "terms"] as const;
    return index === 1 ? ["categoryId", "city", "terms"] as const : ["terms"] as const;
  };

  const next = async () => {
    const valid = await trigger(fieldForStep(step) as unknown as (keyof Values)[]);
    if (!valid) return;
    setStep((s) => Math.min(s + 1, lastStep));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = form.handleSubmit(async (v) => {
    setSubmitting(true);
    try {
      const { registerCustomer, registerWorker } = await import("@/services/auth");
      const session =
        v.role === "WORKER"
          ? await registerWorker({
              name: v.name,
              email: v.email,
              phone: v.phone,
              password: v.password,
              categoryId: v.categoryId!,
              city: v.city,
            })
          : await registerCustomer({
              name: v.name,
              email: v.email,
              phone: v.phone,
              password: v.password,
              city: v.city,
            });
      setDone(true);
      toast.success(
        v.role === "WORKER" ? "Registration submitted" : "Account created",
        v.role === "WORKER"
          ? "Our team will verify your documents before you go live."
          : "Welcome to KaamWala — start exploring services.",
      );
      window.setTimeout(() => router.replace(homePathForRole(session.role)), 1400);
    } catch (error) {
      toast.error("Registration failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  });

  const err = formState.errors;

  return (
    <div className="bg-muted/30 flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <AppLogo className="mb-4 justify-center" />
          <h1 className="text-2xl font-bold tracking-tight">Create your KaamWala account</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {isWorker
              ? "Join as a professional and start earning within a week."
              : "Book trusted professionals for your home in minutes."}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex gap-1.5" role="list" aria-label="Progress">
              {steps.map((label, i) => (
                <div key={label} className="flex-1" role="listitem">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-colors",
                      i <= step ? "bg-brand" : "bg-border",
                    )}
                  />
                  <p className={cn("mt-1.5 text-[11px]", i === step ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {done ? (
              <div className="py-8 text-center">
                <div className="bg-success/15 text-success mx-auto flex size-14 items-center justify-center rounded-full">
                  <CheckCircle2 className="size-7" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">
                  {isWorker ? "Registration submitted" : "Account created"}
                </h2>
                <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm">
                  {isWorker
                    ? "We are verifying your documents. You can explore your worker profile while you wait."
                    : "Taking you to your dashboard…"}
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 grid grid-cols-2 gap-1 rounded-lg p-1">
                      {(["CUSTOMER", "WORKER"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setValue("role", r)}
                          aria-pressed={values.role === r}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                            values.role === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {r === "CUSTOMER" ? <User className="size-4" /> : <Wrench className="size-4" />}
                          {r === "CUSTOMER" ? "I need a service" : "I provide a service"}
                        </button>
                      ))}
                    </div>

                    <Field label="Full name" error={err.name?.message} htmlFor="name">
                      <Input id="name" autoComplete="name" placeholder="Your full name" icon={<User />} {...register("name")} />
                    </Field>

                    <Field label="email address" error={err.email?.message} htmlFor="reg-email">
                      <Input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        icon={<Mail />}
                        {...register("email")}
                      />
                    </Field>

                    <Field label="Mobile number" error={err.phone?.message} htmlFor="phone">
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        placeholder="10-digit mobile"
                        icon={<Phone />}
                        {...register("phone")}
                      />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Password" error={err.password?.message} htmlFor="reg-password">
                        <Input
                          id="reg-password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="Min. 8 characters"
                          {...register("password")}
                        />
                      </Field>
                      <Field label="Confirm password" error={err.confirmPassword?.message} htmlFor="confirm">
                        <Input
                          id="confirm"
                          type="password"
                          autoComplete="new-password"
                          placeholder="Repeat password"
                          {...register("confirmPassword")}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    {isWorker && (
                      <div className="space-y-1.5">
                        <Label>Your trade</Label>
                        <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto scrollbar-thin sm:grid-cols-3">
                          {(categoriesQuery.data ?? []).map((c) => {
                            const active = values.categoryId === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setValue("categoryId", c.id, { shouldValidate: true })}
                                aria-pressed={active}
                                className={cn(
                                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center text-[13px] transition",
                                  active
                                    ? "border-brand bg-brand-soft text-brand-soft-foreground"
                                    : "border-border hover:border-brand/40",
                                )}
                              >
                                <DynamicIcon name={c.icon} className="size-5" />
                                <span className="line-clamp-2 leading-tight">{c.name}</span>
                              </button>
                            );
                          })}
                        </div>
                        {err.categoryId && <p className="text-destructive text-[13px]">Select your trade</p>}
                      </div>
                    )}

                    <Field label="City" error={err.city?.message} htmlFor="city">
                      <Select value={values.city} onValueChange={(v) => setValue("city", v, { shouldValidate: true })}>
                        <SelectTrigger id="city">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CITIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {isWorker && (
                      <p className="text-muted-foreground bg-muted/50 rounded-lg p-3 text-[13px] leading-relaxed">
                        After registering you will upload Aadhaar, PAN and address proof. Your profile goes live once
                        verification is approved.
                      </p>
                    )}
                  </div>
                )}

                {step === lastStep && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 space-y-2 rounded-lg p-4 text-sm">
                      <SummaryRow label="Name" value={values.name ?? "—"} />
                      <SummaryRow label="Email" value={values.email ?? "—"} />
                      <SummaryRow label="Phone" value={values.phone ?? "—"} />
                      <SummaryRow label="City" value={values.city ?? "—"} />
                      {isWorker && (
                        <SummaryRow
                          label="Trade"
                          value={categoriesQuery.data?.find((c) => c.id === values.categoryId)?.name ?? "—"}
                        />
                      )}
                    </div>

                    <div>
                      <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                        <Checkbox
                          className="mt-0.5"
                          checked={values.terms}
                          onCheckedChange={(v) => setValue("terms", Boolean(v) as unknown as true, { shouldValidate: true })}
                          aria-label="Accept terms and conditions"
                        />
                        <span className="text-muted-foreground leading-relaxed">
                          I agree to the{" "}
                          <Link href="/legal/terms" className="text-brand hover:underline">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/legal/privacy" className="text-brand hover:underline">
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      </label>
                      {err.terms && <p className="text-destructive mt-1 pl-7 text-[13px]">{err.terms.message}</p>}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex gap-2">
                  {step > 0 && (
                    <Button type="button" variant="outline" onClick={back} className="flex-1">
                      Back
                    </Button>
                  )}
                  {step < lastStep ? (
                    <Button type="button" onClick={next} className="flex-1" icon={<ArrowRight />}>
                      Continue
                    </Button>
                  ) : (
                    <Button type="submit" className="flex-1" loading={submitting}>
                      {isWorker ? "Submit registration" : "Create Account"}
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-destructive text-[13px]">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value || "—"}</span>
    </div>
  );
}
