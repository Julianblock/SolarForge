import { planById, projectSchema, type PlanId } from "@solarforge/shared";
import { readSession } from "@/lib/auth";
import { database } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

function planId(value: string): PlanId {
  if (value === "PRO") return "pro";
  if (value === "PROFESSIONAL") return "professional";
  return "free";
}

export async function GET() {
  const db = database();
  const userId = await readSession();
  if (!db || !userId) return Response.json({ mode: "local", projects: [] });
  const projects = await db.project.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return Response.json({ mode: "account", projects });
}

export async function POST(request: Request) {
  if (!rateLimit(`projects:${request.headers.get("x-forwarded-for") ?? "local"}`, 40)) {
    return Response.json({ message: "Too many saves." }, { status: 429 });
  }
  const db = database();
  const userId = await readSession();
  if (!db || !userId) return Response.json({ message: "Sign in to save on the server. This browser can still keep a local project." }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) return Response.json({ message: "Account not found." }, { status: 401 });
  const parsed = projectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Project payload was not valid." }, { status: 400 });
  const owned = await db.project.findFirst({ where: { id: parsed.data.id, userId } });
  const limit = planById(planId(user.plan)).projectLimit;
  const count = await db.project.count({ where: { userId } });
  if (!owned && limit !== null && count >= limit) {
    return Response.json({ message: "The free plan stores one server project." }, { status: 402 });
  }
  if (owned) {
    await db.project.update({ where: { id: owned.id }, data: { name: parsed.data.name, data: parsed.data as object } });
  } else {
    await db.project.create({ data: { id: parsed.data.id, userId, name: parsed.data.name, data: parsed.data as object } });
  }
  return Response.json({ message: "Saved to your account." });
}
