import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar panel angle calculator", "Compare tilt angles for one kilowatt at your latitude. The best tilt in this model is not a structural recommendation.", "/solar-panel-angle-calculator");

export default function Page() {
  return <ToolPage slug="solar-panel-angle-calculator" title="Solar panel angle calculator" intro="Compare tilt angles for one kilowatt at your latitude. The best tilt in this model is not a structural recommendation." />;
}
