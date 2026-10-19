import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar azimuth calculator", "Azimuth is degrees clockwise from true north. The note under the form tells you whether the equator is north or south of the site.", "/solar-azimuth-calculator");

export default function Page() {
  return <ToolPage slug="solar-azimuth-calculator" title="Solar azimuth calculator" intro="Azimuth is degrees clockwise from true north. The note under the form tells you whether the equator is north or south of the site." />;
}
