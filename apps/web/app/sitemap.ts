import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/format";
import { articles } from "@/lib/articles";

const paths = [
  "/",
  "/start",
  "/dashboard",
  "/design",
  "/equipment",
  "/assistant",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/wiring",
  "/account",
  "/settings",
  "/learn",
  "/solar-calculator",
  "/solar-panel-angle-calculator",
  "/solar-azimuth-calculator",
  "/solar-battery-calculator",
  "/off-grid-solar-calculator",
  "/solar-panel-cost-calculator",
  "/solar-system-size-calculator",
  "/solar-inverter-calculator",
  "/solar-shading-calculator",
  "/solar-payback-calculator",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...paths.map((path) => ({ url: new URL(path, siteUrl).toString(), lastModified: now })),
    ...articles.map((article) => ({ url: new URL(`/learn/${article.slug}`, siteUrl).toString(), lastModified: now })),
  ];
}
