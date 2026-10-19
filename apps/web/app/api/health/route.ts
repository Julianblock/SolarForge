export function GET() {
  return Response.json({
    ok: true,
    service: "solarforge-web",
    database: Boolean(process.env.DATABASE_URL),
    nrel: Boolean(process.env.NREL_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
  });
}
