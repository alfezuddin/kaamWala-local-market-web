import type { Metadata } from "next";
import { CustomerProfilePage } from "@/components/features/customer-profile";

export const metadata: Metadata = {
  title: "My profile",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CustomerProfilePage />;
}
