import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Contact", "How to reach SolarForge.", "/contact");

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "planning@example.com";
  return (
    <article className="wrap section">
      <h1 className="display">Contact</h1>
      <p>Email <a href={`mailto:${email}`}>{email}</a>. The address comes from NEXT_PUBLIC_CONTACT_EMAIL. The example value is a placeholder, not a monitored inbox.</p>
      <p>This page does not store a message on a server. There is no contact database in the local demo.</p>
    </article>
  );
}
