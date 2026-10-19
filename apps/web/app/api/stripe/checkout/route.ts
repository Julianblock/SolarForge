import { z } from "zod";
import { siteUrl } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({ plan: z.enum(["pro", "professional"]) });

export async function POST(request: Request) {
  if (!rateLimit(`stripe:${request.headers.get("x-forwarded-for") ?? "local"}`, 10)) {
    return Response.json({ message: "Too many checkout attempts." }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Choose Pro or Professional." }, { status: 400 });
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = parsed.data.plan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_PROFESSIONAL;
  if (!secret || !price) {
    return Response.json({ message: "Stripe is not configured. Set STRIPE_SECRET_KEY and the price ID for this plan." }, { status: 503 });
  }
  const form = new URLSearchParams({
    mode: "subscription",
    success_url: `${siteUrl}/pricing?checkout=success`,
    cancel_url: `${siteUrl}/pricing?checkout=cancel`,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const payload = (await response.json()) as { url?: string; error?: { message?: string } };
  if (!response.ok || !payload.url) return Response.json({ message: payload.error?.message ?? "Stripe did not open a checkout." }, { status: 502 });
  return Response.json({ url: payload.url });
}
