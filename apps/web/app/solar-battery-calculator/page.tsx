import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar battery calculator", "Turn daily kilowatt-hours and days of autonomy into usable and nominal battery energy for one sample LiFePO4 module.", "/solar-battery-calculator");

export default function Page() {
  return <ToolPage slug="solar-battery-calculator" title="How big should the battery be?" intro="Type the electricity you use in one day, and how many cloudy days you want covered. The answer is energy you can actually use, not the number printed on the box." />;
}
