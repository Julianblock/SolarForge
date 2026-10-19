import { ToolPage } from "@/components/tool-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Solar shading calculator", "Screen one obstacle against the sun path. The loss is preliminary geometry, not a shade study.", "/solar-shading-calculator");

export default function Page() {
  return <ToolPage slug="solar-shading-calculator" title="Solar shading calculator" intro="Screen one obstacle against the sun path. The loss is preliminary geometry, not a shade study." />;
}
