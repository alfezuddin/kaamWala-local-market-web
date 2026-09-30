import type { Metadata } from "next";
import { AdminSettingsPage } from "@/components/features/admin-settings";

export const metadata: Metadata = {
  title: "Settings · Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminSettingsPage />;
}
