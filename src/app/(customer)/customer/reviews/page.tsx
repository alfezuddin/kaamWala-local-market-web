import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerReviewsPage } from "@/components/features/customer-reviews";
import { PageLoader } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "My reviews",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CustomerReviewsPage />
    </Suspense>
  );
}
