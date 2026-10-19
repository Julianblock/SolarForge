import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Off-grid solar calculator", "Size both the array and a battery. Check the winter month before you trust the annual total.", "/off-grid-solar-calculator");

export default function Page() {
  return <ToolPage slug="off-grid-solar-calculator" title="Off-grid solar calculator" intro="Size both the array and a battery. Check the winter month before you trust the annual total." />;
}
