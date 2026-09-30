import type { Metadata } from "next";
import { CustomerNotificationsPage } from "@/components/features/customer-notifications";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CustomerNotificationsPage homeHref="/worker/dashboard" role="WORKER" />;
}
