import type { Metadata } from "next";
import { WorkerDetail } from "@/components/features/worker-detail";
import { getWorkerById } from "@/services/workers";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { worker } = await getWorkerById(id);
  if (!worker) {
    return buildMetadata({
      title: "Profile not found",
      description: "This KaamWala profile is unavailable.",
      path: `/workers/${id}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${worker.name} — ${worker.headline}`,
    description: `${worker.headline} in ${worker.city}. ${worker.rating.toFixed(1)}★ from ${worker.reviewCount} reviews, ${worker.experienceYears} years experience. Book on KaamWala.`,
    path: `/workers/${worker.id}`,
    type: "profile",
  });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkerDetail id={id} />;
}
