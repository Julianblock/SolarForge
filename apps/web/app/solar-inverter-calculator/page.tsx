import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar inverter calculator", "Check a sample string against a sample inverter. The result is a planning warning, not a listing or a permit.", "/solar-inverter-calculator");

export default function Page() {
  return <ToolPage slug="solar-inverter-calculator" title="Solar inverter calculator" intro="Check a sample string against a sample inverter. The result is a planning warning, not a listing or a permit." />;
}
