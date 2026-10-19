"use client";

import { PLANS, type PlanId } from "@solarforge/shared";
import { useState } from "react";
import { readPlan, writePlan } from "@/lib/storage";
import { track } from "@/lib/track";

export default function PricingPage() {
  const [message, setMessage] = useState<string | null>(null);

  async function checkout(plan: PlanId) {
    track("checkout_clicked", { plan });
    if (plan === "free") {
      writePlan("free");
      setMessage("This browser is on the free plan.");
      return;
    }
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const payload = (await response.json()) as { url?: string; message?: string };
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    writePlan(plan);
    setMessage(payload.message ?? "Stripe is not configured. The plan was stored only in this browser so you can preview Pro tools. It is not a purchase.");
  }

  return (
    <div className="wrap section">
      <p className="kicker">Pricing</p>
      <h1 className="display">Plans</h1>
      <p className="muted">Amounts come from the shared pricing configuration. Stripe price IDs are environment variables, not hardcoded keys.</p>
      {message ? <p className="banner">{message} Current browser plan: {readPlan()}.</p> : null}
      <div className="grid-3">
        {PLANS.map((plan) => (
          <article key={plan.id} className="card">
            <h2>{plan.name}</h2>
            <p className="price">{plan.monthlyUsd === 0 ? "$0" : `$${plan.monthlyUsd}`}<span>{plan.monthlyUsd ? " / month" : ""}</span></p>
            <p>{plan.audience}</p>
            <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <button className="btn btn-primary" type="button" onClick={() => void checkout(plan.id)}>{plan.id === "free" ? "Use free" : `Choose ${plan.name}`}</button>
          </article>
        ))}
      </div>
      <p className="muted">Professional team seats are listed so the tier is honest about what is missing. They are not implemented.</p>
    </div>
  );
}
