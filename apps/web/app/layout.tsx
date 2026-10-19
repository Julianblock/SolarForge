import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/chrome";
import { siteUrl } from "@/lib/format";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "SolarForge", template: "%s · SolarForge" },
  description: "Calculate solar production, panel angle, batteries, and equipment before you buy.",
  applicationName: "SolarForge",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SolarForge",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  description: "Solar planning calculators and a preliminary system designer.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SiteHeader />
        <main id="content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
