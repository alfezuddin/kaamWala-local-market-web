import type { Metadata } from "next";
import { AdminBookingDetailPage } from "@/components/features/admin-booking-detail";

export const metadata: Metadata = {
  title: "Booking · Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminBookingDetailPage />;
}
