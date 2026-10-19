import type { Metadata } from "next";
import { ReportView } from "@/components/report-view";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("Project report", "Preliminary SolarForge planning report.", "/report");

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const params = await searchParams;
  if (!params.project) return <p className="wrap section">Open a report from a saved project.</p>;
  return <ReportView projectId={params.project} />;
}
