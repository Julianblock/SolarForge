import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar calculator", "Estimate annual AC energy from latitude, tilt, azimuth, and daily use. Registration is not required.", "/solar-calculator");

export default function Page() {
  return <ToolPage slug="solar-calculator" title="How much electricity?" intro="Type where the house is and which way the panels face. The big number is electricity for a whole year, the same unit as a power bill. You do not need an account." />;
}
