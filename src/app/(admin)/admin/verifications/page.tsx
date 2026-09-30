import type { Metadata } from "next";
import { AdminVerificationsPage } from "@/components/features/admin-verifications";

export const metadata: Metadata = {
  title: "Verifications · Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminVerificationsPage />;
}
