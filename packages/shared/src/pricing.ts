export type PlanId = "free" | "pro" | "professional";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  /** Display price in USD per month. Change it here; do not scatter prices through the UI. */
  monthlyUsd: number;
  audience: string;
  features: string[];
  projectLimit: number | null;
}

/**
 * Commercial tiers. Stripe price IDs stay in environment variables.
 * These amounts are the product configuration, not a receipt.
 */
export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    monthlyUsd: 0,
    audience: "Learn the basics and try one design.",
    projectLimit: 1,
    features: [
      "Azimuth, tilt, and production calculators",
      "Simple array sizing",
      "One saved project on this browser or account",
      "Basic annual production estimate",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyUsd: 19,
    audience: "Homeowners and DIY installers comparing real options.",
    projectLimit: null,
    features: [
      "Unlimited saved projects",
      "Battery and off-grid sizing",
      "Roof layout designer",
      "Shading screen and equipment notes",
      "PDF planning report",
      "AI assistant when a provider key is configured",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    monthlyUsd: 49,
    audience: "People preparing customer-facing planning packs.",
    projectLimit: null,
    features: [
      "Everything in Pro",
      "Project duplication",
      "Customer-facing export header",
      "Multiple saved designs per site",
      "Team seats are not available in this release",
    ],
  },
];

export function planById(id: PlanId): PlanDefinition {
  const plan = PLANS.find((item) => item.id === id);
  if (!plan) throw new Error(`Unknown plan ${id}.`);
  return plan;
}
