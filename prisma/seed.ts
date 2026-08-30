/**
 * Seeds the first superadmin account.
 *
 * Idempotent: re-running will not create duplicates or overwrite an existing
 * account's password. Reads SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD from the
 * environment and refuses to run without them, so no default credential ever
 * ends up in a database.
 *
 * Run with: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const email = process.env.SUPERADMIN_EMAIL?.trim();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env before seeding."
    );
  }

  if (password.length < 12) {
    throw new Error("SUPERADMIN_PASSWORD must be at least 12 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Superadmin ${email} already exists - nothing to do.`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: "Superadmin",
      passwordHash: await bcrypt.hash(password, 12),
      role: "SUPERADMIN",
    },
  });

  console.log(`Created superadmin: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
