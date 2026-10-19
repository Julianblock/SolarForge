import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("About SolarForge", "What SolarForge calculates, and what it refuses to certify.", "/about");

export default function AboutPage() {
  return (
    <article className="wrap section">
      <p className="kicker">About</p>
      <h1 className="display">A planner, not a permit.</h1>
      <p>SolarForge estimates how many panels a house might need, which way they should face, and what a battery and a rough cost look like. The same math is written down so a more experienced person can check the assumptions.</p>
      <p>Solar position follows the NOAA calculator. Monthly energy uses an isotropic transposition and a PVWatts-style loss stack. If you do not supply irradiation or an NREL API key, the horizontal resource is an approximate clearness curve and is labeled that way.</p>
      <p>The app will not tell you a design is code-compliant, structurally sound, or ready for a permit. Those decisions belong to the adopted code and a qualified reviewer.</p>
    </article>
  );
}
