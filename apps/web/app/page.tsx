import Link from "next/link";
import { ProductionPreview } from "@/components/production-preview";
import { PLANS } from "@solarforge/shared";

const choices: Array<[string, string, string, string]> = [
  ["How many panels?", "Start with your power bill. We estimate a panel count for that house.", "/photos/house.jpg", "/start"],
  ["Which way should they face?", "South if you live north of the equator. North if you live south of it.", "/photos/panels.jpg", "/solar-panel-angle-calculator"],
  ["How big a battery?", "Enough stored power for the hours you want the lights on after sunset.", "/photos/array.jpg", "/solar-battery-calculator"],
  ["Will it pay for itself?", "A rough payback, using the price and the electric rate you type in.", "/photos/roof.jpg", "/solar-payback-calculator"],
];

const faqs = [
  ["What is this website?", "A planner. You type a few facts about a house. It estimates how many solar panels, what size battery, and a rough cost. It does not sell panels, and it does not replace an electrician."],
  ["Is this a permit?", "No. A city, a utility, and a qualified installer still have to check the roof, the wires, and the local rules before anyone builds it."],
  ["Do the panels always face south?", "Only if the house is north of the equator. In Australia, South America, and southern Africa, fixed panels generally face north."],
  ["What does free include?", "The calculators and one saved plan. You can look at prices before you decide to pay for more saved plans."],
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="kicker">A planner for your house</p>
            <h1 className="display">Design Your Perfect Solar System. Before You Spend a Dollar.</h1>
            <p className="lede">This page helps you see how many solar panels a home might need, which way they should face, and what they might cost. You do not have to be an electrician.</p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.6rem" }}>
              <Link className="btn btn-primary btn-lg" href="/start">Start Designing — Free</Link>
              <a className="btn btn-secondary btn-lg" href="#example">See an example</a>
            </div>
            <p className="fine">Free. About five minutes. Skip anything you do not know yet.</p>
          </div>
          <figure className="shot">
            <img src="/photos/home-a.jpg" alt="A person setting a solar panel onto a house roof that already has several panels" />
            <figcaption>A solar panel is this dark rectangle. It goes on the roof and turns sunlight into electricity.</figcaption>
          </figure>
        </div>
      </section>

      <section className="section band" id="how">
        <div className="wrap">
          <p className="kicker">What you are looking at</p>
          <h2 className="display">Three things. Then a number.</h2>
          <div className="plain-steps">
            <article>
              <strong>1</strong>
              <div>
                <h3>Your electric bill</h3>
                <p>How much power the house uses. The bill says it in kilowatt-hours, or you can type the dollar amount.</p>
              </div>
            </article>
            <article>
              <strong>2</strong>
              <div>
                <h3>Which way the roof faces</h3>
                <p>Panels work best when they look toward the sun. We suggest a direction. You can change it.</p>
              </div>
            </article>
            <article>
              <strong>3</strong>
              <div>
                <h3>A plain estimate</h3>
                <p>How many panels, how much electricity they might make in a year, and a rough cost. It is a plan, not a quote.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">The pictures, in order</p>
          <h2 className="display">One panel. Then a roof. Then a whole system.</h2>
          <div className="grid-3" style={{ marginTop: "1.4rem" }}>
            <figure className="shot">
              <img src="/photos/house.jpg" alt="A worker carrying a single solar panel across a tile roof" />
              <figcaption>One panel. A house often needs about 15 to 25 of these.</figcaption>
            </figure>
            <figure className="shot">
              <img src="/photos/panels.jpg" alt="Rows of blue solar panels under a bright sky" />
              <figcaption>They face the sun. Shade from a tree means less electricity.</figcaption>
            </figure>
            <figure className="shot">
              <img src="/photos/array.jpg" alt="Long rows of solar panels standing in a field" />
              <figcaption>A field works the same way as a roof. Sun in, electricity out.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="section band" id="example">
        <div className="wrap grid-2" style={{ alignItems: "center" }}>
          <div>
            <p className="kicker">Try this before you type anything</p>
            <h2 className="display">A made-up 5 kilowatt system.</h2>
            <p className="lede">Five kilowatts is the size of the system. The big number beside it is electricity for a year, the same unit as a power bill. They are not the same thing.</p>
          </div>
          <ProductionPreview />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">Pick one question</p>
          <h2 className="display">You do not have to learn the whole site.</h2>
          <div className="choice-grid" style={{ marginTop: "1.4rem" }}>
            {choices.map(([title, copy, src, href]) => (
              <Link key={href} href={href} className="choice">
                <img src={src} alt="" />
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section band" id="pricing">
        <div className="wrap">
          <p className="kicker">Prices</p>
          <h2 className="display">Start with one house. Pay later if you want more.</h2>
          <div className="grid-3" style={{ marginTop: "1.4rem" }}>
            {PLANS.map((plan) => (
              <article key={plan.id} className="card">
                <h3>{plan.name}</h3>
                <p className="price">{plan.monthlyUsd === 0 ? "$0" : `$${plan.monthlyUsd}`}<span>{plan.monthlyUsd === 0 ? "" : " / month"}</span></p>
                <p>{plan.id === "free" ? "Try the planner on one house." : plan.id === "pro" ? "Save as many houses as you want." : "For someone showing plans to a customer."}</p>
                <ul>
                  {(plan.id === "free"
                    ? ["The calculators", "One saved house", "A yearly electricity estimate"]
                    : plan.id === "pro"
                      ? ["Save every house you try", "A battery estimate and a roof drawing", "A report you can download"]
                      : ["Everything in Pro", "A copy of a plan", "A header meant for a customer"]).map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
              </article>
            ))}
          </div>
          <p style={{ marginTop: "1.2rem" }}><Link className="btn btn-secondary" href="/pricing">See what each price includes</Link></p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">Common questions</p>
          <h2 className="display">Short answers.</h2>
          <div className="grid-2" style={{ marginTop: "1.2rem" }}>
            {faqs.map(([question, answer]) => (
              <article key={question} className="card">
                <h3>{question}</h3>
                <p className="muted">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="wrap">
          <h2 className="display">Ready to try it on a real house?</h2>
          <p className="lede" style={{ margin: "0.8rem auto 1.4rem" }}>You will answer one short page at a time. Nothing is bought. Nothing is installed.</p>
          <Link className="btn btn-primary btn-lg" href="/start">Start Designing — Free</Link>
        </div>
      </section>
    </>
  );
}
