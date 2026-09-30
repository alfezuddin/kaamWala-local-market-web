import type { Metadata } from "next";
import { AdminPaymentsPage } from "@/components/features/admin-payments";

export const metadata: Metadata = {
  title: "Payments · Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminPaymentsPage />;
}
