import type { Metadata } from "next";
import { WorkerEarningsPage } from "@/components/features/worker-earnings";

export const metadata: Metadata = {
  title: "Earnings",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <WorkerEarningsPage />;
}
