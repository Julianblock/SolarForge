import Link from "next/link";
import { ProductionPreview } from "@/components/production-preview";
import { PLANS } from "@solarforge/shared";

const tools: Array<[string, string, string]> = [
  ["Panel azimuth and tilt", "Face the equator, then test the angle against your roof.", "/solar-panel-angle-calculator"],
  ["Battery and off-grid", "Separate usable kilowatt-hours from the nameplate.", "/solar-battery-calculator"],
  ["Roof layout", "Draw measured roof sections. Satellite photos are not dimensions.", "/design"],
  ["Cost and payback", "Quotes, rates, and a sensitivity band. Incentives stay blank until you verify them.", "/solar-payback-calculator"],
  ["Equipment notes", "A labeled sample catalog, plus your own rows.", "/equipment"],
  ["Learning center", "Azimuth, series strings, and why winter is the hard month.", "/learn"],
];

const faqs = [
  ["Is this a permit-ready design?", "No. SolarForge is a planning estimate. Structure, fire setbacks, wiring, and interconnection have to be checked by someone qualified in your jurisdiction."],
  ["Where does the weather come from?", "Without an NREL key or a monthly irradiation file, production uses a documented clearness curve. The screen says so. It is not a measured weather file."],
  ["Do panels always face south?", "Only in the northern hemisphere. South of the equator, a fixed array generally faces north. Near the equator, tilt matters less."],
  ["What does the free plan keep?", "The public calculators, a basic production estimate, and one saved project. Pro adds unlimited projects, the layout tool, shading, reports, and the assistant."],
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="wrap grid-2" style={{ alignItems: "center" }}>
          <div>
            <p className="kicker">Solar planning, before the deposit</p>
            <h1 className="display">Design Your Perfect Solar System. Before You Spend a Dollar.</h1>
            <p className="lede">Calculate solar production, find your ideal panel angle, size your batteries, design your system, and understand exactly what equipment you need.</p>
            <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginTop: "1.4rem" }}>
              <Link className="btn btn-primary" href="/start">Start Designing — Free</Link>
              <Link className="btn btn-secondary" href="/solar-calculator">Explore Solar Tools</Link>
            </div>
          </div>
          <ProductionPreview />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">How SolarForge works</p>
          <h2 className="display">One calculation path on the web and the phone.</h2>
          <div className="steps grid-3">
            <article className="card"><h3>Describe the site</h3><p className="muted">Name the project, drop a pin or type coordinates, and enter the bill or the appliances. Skip anything you do not know yet.</p></article>
            <article className="card"><h3>Set the array</h3><p className="muted">Azimuth is degrees clockwise from true north. The geometry suggests south in the north and north in the south, then you can override it.</p></article>
            <article className="card"><h3>Compare and export</h3><p className="muted">See monthly energy, a battery bank, and a payback band. Save one free project and download a preliminary PDF.</p></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">Tools</p>
          <h2 className="display">The parts of a system, separated on purpose.</h2>
          <div className="grid-3">
            {tools.map(([title, copy, href]) => (
              <Link key={href} href={href} className="card" style={{ textDecoration: "none" }}>
                <h3>{title}</h3>
                <p className="muted">{copy}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid-2">
          <div>
            <p className="kicker">Demo projects</p>
            <h2 className="display">Examples, clearly marked.</h2>
            <p className="muted">These are not customers and not measured systems. They show the shape of a dashboard until real project stories exist.</p>
          </div>
          <div className="card">
            <p className="chip">Demo data</p>
            <h3>Maple Street roof — fictional</h3>
            <p>7.2 kW DC, south-facing, 30° tilt, about 10 MWh/year in the approximate model. No battery.</p>
            <h3>High-desert cabin — fictional</h3>
            <p>3.2 kW DC, two days of LiFePO4 autonomy, winter month drives the battery, not the annual total.</p>
          </div>
        </div>
      </section>

      <section className="section" id="pricing">
        <div className="wrap">
          <p className="kicker">Free vs Pro</p>
          <h2 className="display">Pricing lives in one configuration file.</h2>
          <div className="grid-3">
            {PLANS.map((plan) => (
              <article key={plan.id} className="card">
                <h3>{plan.name}</h3>
                <p className="price">{plan.monthlyUsd === 0 ? "$0" : `$${plan.monthlyUsd}`}<span>{plan.monthlyUsd === 0 ? "" : " / month"}</span></p>
                <p className="muted">{plan.audience}</p>
                <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              </article>
            ))}
          </div>
          <p style={{ marginTop: "1rem" }}><Link className="btn btn-secondary" href="/pricing">See pricing details</Link></p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">Questions</p>
          <h2 className="display">Straight answers.</h2>
          <div className="grid-2">
            {faqs.map(([question, answer]) => (
              <article key={question} className="card">
                <h3>{question}</h3>
                <p className="muted">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
