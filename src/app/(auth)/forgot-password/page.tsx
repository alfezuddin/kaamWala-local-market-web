import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/components/features/forgot-password-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Reset Password",
  description: "Reset your KaamWala account password.",
  path: "/forgot-password",
  noIndex: true,
});

export default function Page() {
  return <ForgotPasswordPage />;
}
