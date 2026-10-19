import type { Metadata } from "next";
import { siteUrl } from "./format";

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const url = new URL(path, siteUrl).toString();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "SolarForge", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}
