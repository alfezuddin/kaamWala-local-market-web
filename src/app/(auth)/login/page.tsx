import type { Metadata } from "next";
import { LoginPage } from "@/components/features/login-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sign In",
  description: "Sign in to KaamWala to book services, manage bookings or track earnings.",
  path: "/login",
  noIndex: true,
});

export default function Page() {
  return <LoginPage />;
}
