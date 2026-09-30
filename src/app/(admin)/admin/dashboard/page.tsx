import type { Metadata } from "next";
import { AdminDashboardPage } from "@/components/features/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminDashboardPage />;
}
