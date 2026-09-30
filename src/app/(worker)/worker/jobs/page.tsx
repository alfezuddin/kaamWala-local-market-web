import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkerJobsPage } from "@/components/features/worker-jobs";
import { PageLoader } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "My Jobs",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <WorkerJobsPage />
    </Suspense>
  );
}
