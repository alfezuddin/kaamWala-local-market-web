"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AppLogo } from "@/components/ui/app-logo";
import { Separator } from "@/components/ui/primitives";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { login, homePathForRole } from "@/services/auth";
import { DEMO_ACCOUNTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
  role: z.enum(["CUSTOMER", "WORKER", "ADMIN"]),
  remember: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { session, signIn } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", role: "CUSTOMER", remember: true },
    mode: "onSubmit",
  });

  React.useEffect(() => {
    if (session) router.replace(homePathForRole(session.role));
  }, [session, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const authSession = await login({ email: values.email, password: values.password, role: values.role });
      signIn(authSession);
      toast.success(`Welcome back, ${authSession.name.split(" ")[0]}!`, "You are now signed in.");
      router.replace(homePathForRole(authSession.role));
    } catch (error) {
      toast.error("Sign in failed", error instanceof Error ? error.message : "Please check your details and try again.");
      form.setError("password", { message: "Incorrect email or password" });
    } finally {
      setSubmitting(false);
    }
  });

  const signInAsDemo = (role: Role, email: string, password: string) => {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", password, { shouldValidate: true });
    form.setValue("role", role);
    setSubmitting(true);
    login({ email, password, role })
      .then((authSession) => {
        signIn(authSession);
        toast.success(`Signed in as ${authSession.name}`, `Demo ${role.toLowerCase()} account loaded.`);
        router.replace(homePathForRole(authSession.role));
      })
      .catch((error) => {
        toast.error("Demo sign in failed", error instanceof Error ? error.message : undefined);
      })
      .finally(() => setSubmitting(false));
  };

  const { register, setValue, formState } = form;
  const errors = formState.errors;
  const role = useWatch({ control: form.control, name: "role" });
  const remember = useWatch({ control: form.control, name: "remember" });

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <AppLogo className="mb-6 justify-center lg:justify-start" />
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Sign in to manage bookings, chats and earnings.</p>
          </div>

          <Tabs value={role} onValueChange={(v) => setValue("role", v as Role)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="CUSTOMER">Customer</TabsTrigger>
              <TabsTrigger value="WORKER">Worker</TabsTrigger>
              <TabsTrigger value="ADMIN">Admin</TabsTrigger>
            </TabsList>

            {(["CUSTOMER", "WORKER", "ADMIN"] as Role[]).map((r) => (
              <TabsContent key={r} value={r} className="mt-5">
                <form onSubmit={onSubmit} noValidate className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`email-${r}`}>email address</Label>
                    <Input
                      id={`email-${r}`}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      icon={<Mail />}
                      aria-invalid={Boolean(errors.email)}
                      {...register("email")}
                    />
                    {errors.email && <p className="text-destructive text-[13px]">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`password-${r}`}>Password</Label>
                      <Link href="/forgot-password" className="text-brand text-[13px] hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id={`password-${r}`}
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      icon={<KeyRound />}
                      aria-invalid={Boolean(errors.password)}
                      {...register("password")}
                    />
                    {errors.password && <p className="text-destructive text-[13px]">{errors.password.message}</p>}
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={remember ?? false}
                      onCheckedChange={(v) => setValue("remember", Boolean(v))}
                      aria-label="Keep me signed in"
                    />
                    <span className="text-muted-foreground">Keep me signed in on this device</span>
                  </label>

                  <Button type="submit" className="w-full" size="lg" loading={submitting} icon={<ArrowRight />}>
                    Sign in as {r.toLowerCase()}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs uppercase">or use a demo account</span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={submitting}
                onClick={() => signInAsDemo(account.role, account.email, account.password)}
                className={cn(
                  "bg-card hover:border-brand/50 focus-visible:ring-brand/40 flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition disabled:opacity-60",
                  "focus-visible:ring-2 focus-visible:outline-none",
                )}
              >
                <div className="bg-brand-soft text-brand-soft-foreground flex size-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold">
                  {account.role.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{account.label}</p>
                  <p className="text-muted-foreground truncate text-[13px]">
                    {account.email} · {account.password}
                  </p>
                </div>
                <ArrowRight className="text-muted-foreground size-4 shrink-0" />
              </button>
            ))}
          </div>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            New to KaamWala?{" "}
            <Link href="/register" className="text-brand font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <aside className="from-brand/10 via-brand/5 hidden bg-gradient-to-br to-transparent p-12 lg:flex lg:flex-col lg:justify-center">
        <div className="max-w-md">
          <Badge variant="brand" size="lg">
            <Sparkles />
            Trusted by 12,000+ households
          </Badge>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight">
            One account for every service your home needs.
          </h2>
          <ul className="mt-8 space-y-5">
            {[
              {
                icon: ShieldCheck,
                title: "Verified professionals only",
                body: "Every worker clears Aadhaar and address verification before going live.",
              },
              {
                icon: KeyRound,
                title: "Pay after the work is done",
                body: "Release payment only when you are satisfied — full refund if cancelled.",
              },
              {
                icon: Sparkles,
                title: "One place for every role",
                body: "Customers book, workers earn, admins oversee — all from the same platform.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <div className="bg-brand text-brand-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <item.icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

export { Card, CardContent };
