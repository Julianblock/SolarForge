import { clearSessionCookie, readSession } from "@/lib/auth";
import { database } from "@/lib/db";

export async function DELETE() {
  const db = database();
  const userId = await readSession();
  if (!db || !userId) return Response.json({ message: "No signed-in account on this server." }, { status: 401 });
  await db.project.deleteMany({ where: { userId } });
  await db.user.update({ where: { id: userId }, data: { deletedAt: new Date(), email: `deleted-${userId}@solarforge.invalid` } });
  await clearSessionCookie();
  return Response.json({ message: "Account deleted." });
}
