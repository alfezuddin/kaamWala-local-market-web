import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerBookingsPage } from "@/components/features/customer-bookings";
import { PageLoader } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "My Bookings",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CustomerBookingsPage />
    </Suspense>
  );
}
