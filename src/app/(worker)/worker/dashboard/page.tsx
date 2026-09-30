import type { Metadata } from "next";
import { WorkerDashboardPage } from "@/components/features/worker-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <WorkerDashboardPage />;
}
