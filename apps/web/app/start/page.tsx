import type { Metadata } from "next";
import { ProjectWizard } from "@/components/wizard";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("Start a solar project", "Create a solar project from location, usage, azimuth, and tilt.", "/start");

export default function StartPage() {
  return <ProjectWizard />;
}
