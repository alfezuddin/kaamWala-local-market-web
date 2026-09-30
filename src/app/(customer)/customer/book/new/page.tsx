import type { Metadata } from "next";
import { Suspense } from "react";
import { BookServicePage } from "@/components/features/book-service-page";
import { PageLoader } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Book a service",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BookServicePage />
    </Suspense>
  );
}
