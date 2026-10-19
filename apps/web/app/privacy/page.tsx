import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Privacy", "How SolarForge handles project data.", "/privacy");

export default function PrivacyPage() {
  return (
    <article className="wrap section">
      <h1 className="display">Privacy</h1>
      <p>Without an account, projects stay in local storage on your device. Creating an account, when the database is configured, stores the email, a password hash, and the project JSON you save.</p>
      <p>Location is used only to estimate sun position and energy. GPS runs after you grant permission. SolarForge does not sell project data.</p>
      <p>You can delete browser projects from the dashboard. An authenticated account can be deleted from Settings, which removes the user and their saved projects from the database.</p>
      <p>This notice is a product description, not a lawyer-reviewed policy for a specific company.</p>
    </article>
  );
}
