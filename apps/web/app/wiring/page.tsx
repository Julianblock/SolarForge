import { Schematic } from "@/components/schematic";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Electrical planning diagram", "A preliminary one-line diagram. Not a code-compliant design.", "/wiring");

export default function WiringPage() {
  return (
    <article className="wrap section">
      <p className="kicker">Electrical</p>
      <h1 className="display">Preliminary one-line.</h1>
      <p className="banner">This diagram shows relationships only. It does not size conductors, fuses, grounding, or disconnects, and it is not a permit drawing.</p>
      <div className="card"><Schematic battery /></div>
      <p className="muted">Use the inverter calculator for a sample string-voltage check. Cold Voc, MPPT window, and input current still have to match the real datasheets.</p>
    </article>
  );
}
