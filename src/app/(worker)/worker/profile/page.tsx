import type { Metadata } from "next";
import { WorkerProfilePage } from "@/components/features/worker-profile";

export const metadata: Metadata = {
  title: "My profile",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <WorkerProfilePage />;
}
