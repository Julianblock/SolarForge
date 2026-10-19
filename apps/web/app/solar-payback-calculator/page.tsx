import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar payback calculator", "See low, medium, and high payback cases from the production estimate and the cost you enter.", "/solar-payback-calculator");

export default function Page() {
  return <ToolPage slug="solar-payback-calculator" title="Solar payback calculator" intro="See low, medium, and high payback cases from the production estimate and the cost you enter." />;
}
