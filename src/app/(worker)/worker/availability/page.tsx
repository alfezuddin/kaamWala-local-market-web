import type { Metadata } from "next";
import { WorkerAvailabilityPage } from "@/components/features/worker-availability";

export const metadata: Metadata = {
  title: "Availability",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <WorkerAvailabilityPage />;
}
