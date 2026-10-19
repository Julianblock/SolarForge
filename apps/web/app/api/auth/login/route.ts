import { z } from "zod";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { database } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  if (!rateLimit(`login:${request.headers.get("x-forwarded-for") ?? "local"}`, 10)) {
    return Response.json({ message: "Too many attempts. Wait a minute." }, { status: 429 });
  }
  const db = database();
  if (!db || !process.env.AUTH_SECRET) {
    return Response.json({ message: "Sign-in needs DATABASE_URL and AUTH_SECRET." }, { status: 503 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Email or password was not accepted." }, { status: 400 });
  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || user.deletedAt || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return Response.json({ message: "Email or password was not accepted." }, { status: 401 });
  }
  await setSessionCookie(user.id);
  return Response.json({ message: "Signed in." });
}
