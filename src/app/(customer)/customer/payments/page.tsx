import type { Metadata } from "next";
import { CustomerPaymentsPage } from "@/components/features/customer-payments";

export const metadata: Metadata = {
  title: "Payments & Invoices",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CustomerPaymentsPage />;
}
