import { Suspense } from "react";
import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("Dashboard", "Saved solar projects, production, and payback assumptions.", "/dashboard");

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="wrap">Loading projects…</p>}>
      <Dashboard />
    </Suspense>
  );
}
