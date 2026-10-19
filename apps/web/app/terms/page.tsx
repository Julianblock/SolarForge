import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Terms", "Limits of the SolarForge planning tools.", "/terms");

export default function TermsPage() {
  return (
    <article className="wrap section">
      <h1 className="display">Terms</h1>
      <p>SolarForge provides preliminary estimates. You are responsible for checking them against quotes, site measurements, utility rules, and the electrical and building codes that apply where you build.</p>
      <p>Sample equipment is fictional teaching data. Do not buy hardware from those model names. Do not treat a PDF export as a construction document.</p>
      <p>Subscriptions, when Stripe is configured, are billed by Stripe under the price IDs you set. A browser plan preview is not a paid subscription.</p>
    </article>
  );
}
