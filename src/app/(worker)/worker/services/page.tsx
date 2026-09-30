import type { Metadata } from "next";
import { WorkerServicesPage } from "@/components/features/worker-services";

export const metadata: Metadata = {
  title: "My Services & Pricing",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <WorkerServicesPage />;
}
