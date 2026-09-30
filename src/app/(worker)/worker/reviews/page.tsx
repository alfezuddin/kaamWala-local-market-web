import type { Metadata } from "next";
import { WorkerReviewsPage } from "@/components/features/worker-reviews";

export const metadata: Metadata = {
  title: "My reviews",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <WorkerReviewsPage />;
}
