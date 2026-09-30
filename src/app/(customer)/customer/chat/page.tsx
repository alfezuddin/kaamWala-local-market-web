import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatPage } from "@/components/features/chat-page";
import { PageLoader } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatPage basePath="/customer" />
    </Suspense>
  );
}
