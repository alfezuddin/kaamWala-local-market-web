import type { Metadata } from "next";
import { CustomerSettingsPage } from "@/components/features/customer-settings";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CustomerSettingsPage homeHref="/worker/dashboard" />;
}
