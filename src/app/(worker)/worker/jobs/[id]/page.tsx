import type { Metadata } from "next";
import { WorkerJobDetailPage } from "@/components/features/worker-job-detail";

export const metadata: Metadata = {
  title: "Job details",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkerJobDetailPage id={id} />;
}
