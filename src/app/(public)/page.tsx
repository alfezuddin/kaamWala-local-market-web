import { Suspense } from "react";
import { HomePage } from "@/components/features/home-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <HomePage />
    </Suspense>
  );
}
