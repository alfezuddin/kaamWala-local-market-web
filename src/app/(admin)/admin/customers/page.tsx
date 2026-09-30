import type { Metadata } from "next";
import { AdminPeoplePage } from "@/components/features/admin-people";

export const metadata: Metadata = {
  title: "Customers · Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminPeoplePage role="CUSTOMER" />;
}
