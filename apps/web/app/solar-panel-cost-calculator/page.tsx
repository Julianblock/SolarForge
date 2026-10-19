import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar panel cost calculator", "Apply your installed cost and import rate. No incentive is added unless you put one in a saved project.", "/solar-panel-cost-calculator");

export default function Page() {
  return <ToolPage slug="solar-panel-cost-calculator" title="Solar panel cost calculator" intro="Apply your installed cost and import rate. No incentive is added unless you put one in a saved project." />;
}
