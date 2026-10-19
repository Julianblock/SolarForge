import type { Metadata } from "next";
import { LayoutDesigner } from "@/components/layout-designer";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("Roof layout designer", "Place sample modules on a roof using dimensions you measured.", "/design");

export default function DesignPage() {
  return <LayoutDesigner />;
}
