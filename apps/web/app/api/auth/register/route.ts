import { z } from "zod";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { database } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  name: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  if (!rateLimit(`register:${request.headers.get("x-forwarded-for") ?? "local"}`, 8)) {
    return Response.json({ message: "Too many attempts. Wait a minute." }, { status: 429 });
  }
  const db = database();
  if (!db || !process.env.AUTH_SECRET) {
    return Response.json({ message: "Accounts need DATABASE_URL and AUTH_SECRET. Projects still save in this browser." }, { status: 503 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Use a valid email and a password of at least 8 characters." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing && !existing.deletedAt) return Response.json({ message: "That email already has an account." }, { status: 409 });
  const user = existing
    ? await db.user.update({ where: { id: existing.id }, data: { passwordHash: await hashPassword(parsed.data.password), deletedAt: null, name: parsed.data.name } })
    : await db.user.create({ data: { email, name: parsed.data.name, passwordHash: await hashPassword(parsed.data.password) } });
  await setSessionCookie(user.id);
  return Response.json({ message: "Account created." });
}
