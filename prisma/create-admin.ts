/** Creates an ADMIN/Supervisor account without changing existing users. */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { z } from "zod";

async function main() {
  const parsed = z
    .object({
      email: z.email().trim().toLowerCase(),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters.")
        .refine(
          (value) => Buffer.byteLength(value, "utf8") <= 72,
          "Password must be at most 72 UTF-8 bytes."
        ),
      name: z.string().trim().min(1).max(100),
    })
    .safeParse({
      email: process.env.ADMIN_EMAIL?.trim(),
      password: process.env.ADMIN_PASSWORD,
      name: process.env.ADMIN_NAME ?? "Admin",
    });
  if (!parsed.success)
    throw new Error(
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")
    );
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString)
    throw new Error(
      "DATABASE_URL is not set. Run from the project directory with its VPS .env file."
    );
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const { email, password, name } = parsed.data;
    const existing = await db.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing)
      throw new Error(
        "An account already uses this email. No changes were made. Choose another email."
      );
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { email, name, passwordHash, role: "ADMIN", status: "ACTIVE", tenantId: null },
      select: { email: true },
    });
    console.log(`Admin/Supervisor created: ${user.email}. Sign in at /login to access /admin.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error && typeof error === "object" && "code" in error) {
    console.error(
      error.code === "P2002"
        ? "An account already uses this email. No changes were made."
        : "Database operation failed. Check the VPS connection and database permissions."
    );
  } else
    console.error(error instanceof Error ? error.message : "Could not create the admin account.");
  process.exitCode = 1;
});
