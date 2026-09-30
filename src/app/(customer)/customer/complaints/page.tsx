import type { Metadata } from "next";
import { CustomerComplaintsPage } from "@/components/features/customer-complaints";

export const metadata: Metadata = {
  title: "Complaints & Support",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CustomerComplaintsPage />;
}
