import type { Metadata } from "next";
import { AdminComplaintsPage } from "@/components/features/admin-complaints";

export const metadata: Metadata = {
  title: "Complaints · Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminComplaintsPage />;
}
