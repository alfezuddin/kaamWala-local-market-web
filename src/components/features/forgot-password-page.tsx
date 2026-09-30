"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, Mail, MailCheck, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/ui/app-logo";
import { useToast } from "@/components/ui/toaster";
import { requestPasswordReset, sendOtp, verifyOtp } from "@/services/auth";

const requestSchema = z.object({
  identifier: z.string().min(1, "Enter your email or mobile number"),
});
const otpSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});
const resetSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const OTP_LENGTH = 6;

export function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [stage, setStage] = React.useState<"request" | "otp" | "reset">("request");
  const [identifier, setIdentifier] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const requestForm = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { identifier: "" },
  });
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });
  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const submitRequest = requestForm.handleSubmit(async (v) => {
    setBusy(true);
    try {
      await requestPasswordReset(v.identifier);
      setIdentifier(v.identifier);
      setStage("otp");
      toast.info("Code sent", "Use 123456 to complete this demo reset.");
    } catch (error) {
      toast.error("Could not send code", error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(false);
    }
  });

  const submitOtp = otpForm.handleSubmit(async (v) => {
    setBusy(true);
    try {
      await verifyOtp(identifier, v.otp);
      setStage("reset");
      toast.success("Code verified", "Choose a new password.");
    } catch (error) {
      toast.error("Verification failed", error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(false);
    }
  });

  const submitReset = resetForm.handleSubmit(async (v) => {
    setBusy(true);
    try {
      const { resetPassword } = await import("@/services/auth");
      await resetPassword(identifier, v.password);
      toast.success("Password updated", "Sign in with your new password.");
      router.replace("/login");
    } catch (error) {
      toast.error("Could not update password", error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(false);
    }
  });

  const resend = async () => {
    try {
      await sendOtp(identifier);
      toast.info("Code resent", "Check your messages for the new code.");
    } catch {
      toast.error("Could not resend code", "Please try again in a moment.");
    }
  };

  const titles = {
    request: { heading: "Reset your password", body: "Enter the email or mobile number linked to your KaamWala account." },
    otp: { heading: "Verify your identity", body: `We sent a 6-digit code to ${identifier}.` },
    reset: { heading: "Choose a new password.", body: "Use at least 8 characters and keep it easy to remember." },
  } as const;

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <AppLogo className="mb-4 justify-center" />
          <h1 className="text-2xl font-bold tracking-tight">{titles[stage].heading}</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{titles[stage].body}</p>
        </div>

        <Card>
          <CardContent className="p-6">
            {stage === "request" && (
              <form onSubmit={submitRequest} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="identifier">Email or mobile number</Label>
                  <Input
                    id="identifier"
                    autoComplete="username"
                    placeholder="you@example.com or 9876543210"
                    icon={<Mail />}
                    {...requestForm.register("identifier")}
                  />
                  {requestForm.formState.errors.identifier && (
                    <p className="text-destructive text-[13px]">
                      {requestForm.formState.errors.identifier.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" loading={busy} icon={<ArrowRight />}>
                  Send verification code
                </Button>
              </form>
            )}

            {stage === "otp" && (
              <form onSubmit={submitOtp} noValidate className="space-y-4">
                <fieldset>
                  <legend className="mb-2 text-[13px] font-medium">6-digit code</legend>
                  <div className="flex gap-2">
                    {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                      <Input
                        key={i}
                        ref={(el) => otpForm.register("otp").ref(el)}
                        inputMode="numeric"
                        maxLength={1}
                        aria-label={`Digit ${i + 1}`}
                        className="h-12 text-center text-lg"
                        onChange={(e) => {
                          const digits = (otpForm.getValues("otp") || "").split("");
                          digits[i] = e.target.value.replace(/\D/g, "");
                          otpForm.setValue("otp", digits.join("").slice(0, OTP_LENGTH), { shouldValidate: true });
                          if (e.target.value) {
                            const inputs = e.currentTarget.form?.querySelectorAll("input");
                            inputs?.[i + 1]?.focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                  {otpForm.formState.errors.otp && (
                    <p className="text-destructive mt-1.5 text-[13px]">{otpForm.formState.errors.otp.message}</p>
                  )}
                </fieldset>
                <Button type="submit" className="w-full" loading={busy} icon={<ShieldCheck />}>
                  Verify code
                </Button>
                <div className="text-muted-foreground flex items-center justify-between text-[13px]">
                  <button type="button" onClick={() => setStage("request")} className="hover:text-foreground">
                    Change number
                  </button>
                  <button type="button" onClick={resend} className="text-brand hover:underline">
                    Resend code
                  </button>
                </div>
              </form>
            )}

            {stage === "reset" && (
              <form onSubmit={submitReset} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    icon={<KeyRound />}
                    {...resetForm.register("password")}
                  />
                  {resetForm.formState.errors.password && (
                    <p className="text-destructive text-[13px]">{resetForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    {...resetForm.register("confirmPassword")}
                  />
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-destructive text-[13px]">
                      {resetForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" loading={busy} icon={<MailCheck />}>
                  Update password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button asChild variant="ghost" size="sm" icon={<ArrowLeft />}>
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
