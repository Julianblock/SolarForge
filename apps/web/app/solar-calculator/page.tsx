import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar calculator", "Estimate annual AC energy from latitude, tilt, azimuth, and daily use. Registration is not required.", "/solar-calculator");

export default function Page() {
  return <ToolPage slug="solar-calculator" title="Solar calculator" intro="Estimate annual AC energy from latitude, tilt, azimuth, and daily use. Registration is not required." />;
}
