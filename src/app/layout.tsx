import type { Metadata } from "next";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kaamwala.com"),
  title: {
    default: "KaamWala — Har Kaam Ka Bharosemand Saathi",
    template: "%s | KaamWala",
  },
  description:
    "Find verified local workers for plumbing, electrical, cleaning, repairs and more. Transparent pricing, secure payments and trusted professionals near you.",
  applicationName: "KaamWala",
  keywords: ["local service marketplace", "home services", "verified workers", "book a plumber", "KaamWala"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "KaamWala",
    title: "KaamWala — Har Kaam Ka Bharosemand Saathi",
    description:
      "Find trusted, verified workers for every household need. Transparent pricing, secure payments and 24x7 support.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "KaamWala — Har Kaam Ka Bharosemand Saathi",
    description: "Find trusted, verified workers for every household need.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
