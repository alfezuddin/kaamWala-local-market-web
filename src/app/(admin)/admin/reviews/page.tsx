import type { Metadata } from "next";
import { AdminReviewsPage } from "@/components/features/admin-reviews";

export const metadata: Metadata = {
  title: "Reviews · Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminReviewsPage />;
}
