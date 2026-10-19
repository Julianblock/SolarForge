import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar payback calculator", "See low, medium, and high payback cases from the production estimate and the cost you enter.", "/solar-payback-calculator");

export default function Page() {
  return <ToolPage slug="solar-payback-calculator" title="Will it pay for itself?" intro="Type the installed price and what you pay for electricity. You get a low, middle, and high guess for how many years until the savings catch the cost. It is not a bid." />;
}
