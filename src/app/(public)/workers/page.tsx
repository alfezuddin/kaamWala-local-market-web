import { Suspense } from "react";
import type { Metadata } from "next";
import { WorkersPage } from "@/components/features/workers-page";
import { PageLoader } from "@/components/ui/states";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Find a Worker",
  description:
    "Search verified KaamWala professionals by category, city, area, rating and availability. Compare prices and request a service in a few taps.",
  path: "/workers",
});

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <WorkersPage />
    </Suspense>
  );
}
