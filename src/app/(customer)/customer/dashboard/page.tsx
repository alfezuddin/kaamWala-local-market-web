import type { Metadata } from "next";
import { CustomerDashboard } from "@/components/features/customer-dashboard";

export const metadata: Metadata = {
  title: "My Dashboard",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CustomerDashboard />;
}
