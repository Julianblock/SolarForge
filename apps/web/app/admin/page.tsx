import Link from "next/link";
import { SAMPLE_CATALOG } from "@solarforge/shared";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Admin", "Local catalog review for SolarForge.", "/admin");

export default function AdminPage() {
  return (
    <div className="wrap section">
      <h1 className="display">Admin</h1>
      <p className="banner">This screen lists the sample catalog shipped with the app. It does not impersonate a hosted user directory. Sign in as an ADMIN user after seeding the database to manage accounts through the API.</p>
      <p>{SAMPLE_CATALOG.length} sample equipment rows. None are verified.</p>
      <p><Link href="/equipment">Open the catalog</Link></p>
    </div>
  );
}
