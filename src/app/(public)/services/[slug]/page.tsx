import type { Metadata } from "next";
import { ServiceDetail } from "@/components/features/service-detail";
import { getServiceBySlug, getServices } from "@/services/catalog";
import { buildMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/format";

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) {
    return buildMetadata({
      title: "Service not found",
      description: "This service is no longer available on KaamWala.",
      path: `/services/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${service.name} — from ${formatINR(service.startingPrice)}`,
    description: service.shortDescription,
    path: `/services/${service.slug}`,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ServiceDetail slug={slug} />;
}
