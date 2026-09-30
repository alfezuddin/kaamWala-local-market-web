import type { Metadata } from "next";
import { AdminChatPage } from "@/components/features/admin-chat";

export const metadata: Metadata = {
  title: "Support Chat · Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminChatPage />;
}
