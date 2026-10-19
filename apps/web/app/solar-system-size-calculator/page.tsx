import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar system size calculator", "Find the DC kilowatts and module count for a 100 percent annual energy offset.", "/solar-system-size-calculator");

export default function Page() {
  return <ToolPage slug="solar-system-size-calculator" title="Solar system size calculator" intro="Find the DC kilowatts and module count for a 100 percent annual energy offset." />;
}
