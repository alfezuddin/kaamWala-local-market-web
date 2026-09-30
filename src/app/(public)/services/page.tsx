import { Suspense } from "react";
import type { Metadata } from "next";
import { ServicesPage } from "@/components/features/services-page";
import { PageLoader } from "@/components/ui/states";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Services",
  description:
    "Browse every home and professional service on KaamWala — electrical, plumbing, cleaning, beauty, tutoring and more, with fixed visit charges and verified workers.",
  path: "/services",
});

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ServicesPage />
    </Suspense>
  );
}
