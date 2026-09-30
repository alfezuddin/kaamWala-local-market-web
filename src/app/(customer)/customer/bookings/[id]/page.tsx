import type { Metadata } from "next";
import { BookingDetailPage } from "@/components/features/booking-detail-page";

export const metadata: Metadata = {
  title: "Booking Details",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetailPage id={id} />;
}
