import type { Metadata } from "next";
import { AdminServicesPage } from "@/components/features/admin-services";

export const metadata: Metadata = {
  title: "Services · Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminServicesPage />;
}
