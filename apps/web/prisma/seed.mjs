/**
 * Seeds nothing unless SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are set.
 * There is no default password in the repository.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const prisma = new PrismaClient();

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;

if (!email || !password) {
  console.log("Seed skipped. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create an admin.");
} else {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 32);
  const passwordHash = `${salt}:${Buffer.from(derived).toString("hex")}`;
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, role: "ADMIN", name: "Admin" },
    create: { email: email.toLowerCase(), passwordHash, role: "ADMIN", name: "Admin", plan: "PROFESSIONAL" },
  });
  console.log(`Admin ${email} is ready.`);
}

await prisma.$disconnect();
