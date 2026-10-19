import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

const scrypt = promisify(scryptCb);
const COOKIE = "sf_session";

function secret(): string | null {
  return process.env.AUTH_SECRET || null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 32)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scrypt(password, salt, 32)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

export function signSession(userId: string): string {
  const key = secret();
  if (!key) throw new Error("AUTH_SECRET is not set.");
  const expiry = Date.now() + 1000 * 60 * 60 * 24 * 14;
  const payload = `${userId}.${expiry}`;
  const mac = createHmac("sha256", key).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

export async function readSession(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const [userId, expiry, mac] = raw.split(".");
  if (!userId || !expiry || !mac) return null;
  if (Number(expiry) < Date.now()) return null;
  const key = secret();
  if (!key) return null;
  const expected = createHmac("sha256", key).update(`${userId}.${expiry}`).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}

export async function setSessionCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
