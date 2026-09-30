import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterPage } from "@/components/features/register-page";
import { PageLoader } from "@/components/ui/states";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Create Account",
  description: "Create a KaamWala account as a customer to book services, or as a professional to start earning.",
  path: "/register",
  noIndex: true,
});

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RegisterPage />
    </Suspense>
  );
}
