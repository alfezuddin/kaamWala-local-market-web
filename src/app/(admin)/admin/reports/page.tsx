import type { Metadata } from "next";
import { AdminReportsPage } from "@/components/features/admin-reports";

export const metadata: Metadata = {
  title: "Reports · Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminReportsPage />;
}
