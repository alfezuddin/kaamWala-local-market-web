import type { Metadata } from "next";
import { AdminBookingsPage } from "@/components/features/admin-bookings";

export const metadata: Metadata = {
  title: "Bookings · Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminBookingsPage />;
}
