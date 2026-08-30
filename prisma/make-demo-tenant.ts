/**
 * Creates a demo tenant and its login account for local testing.
 * Run with: npx tsx prisma/make-demo-tenant.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const superadmin = await db.user.findFirst({ where: { role: "SUPERADMIN" } });
  if (!superadmin) throw new Error("No superadmin found - run npm run db:seed first.");

  const existing = await db.tenant.findUnique({ where: { slug: "demo-gym" } });
  if (existing) {
    console.log("Demo tenant already exists.");
    return;
  }

  await db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: "Demo Gym",
        location: "Gulberg III, Lahore",
        slug: "demo-gym",
        createdById: superadmin.id,
      },
    });

    await tx.user.create({
      data: {
        email: "demo@gym.local",
        name: "Demo Gym",
        passwordHash: await bcrypt.hash("demogym12345", 12),
        role: "TENANT",
        tenantId: tenant.id,
      },
    });
  });

  console.log("Created: demo@gym.local / demogym12345");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
