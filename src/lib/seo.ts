import type { Metadata } from "next";

export const SITE_URL = "https://kaamwala.com";

export function buildMetadata({
  title,
  description,
  path = "/",
  type = "website",
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: `${title} | KaamWala`,
      description,
      url,
      type,
      siteName: "KaamWala",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Serialises a JSON-LD object for a `<script type="application/ld+json">` tag. */
export function jsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data);
}
