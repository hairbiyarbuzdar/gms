"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/guards";
import { createTenantSchema } from "@/lib/validators/tenant";

export type CreateTenantState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"name" | "location" | "email" | "password", string>>;
};

/** "Downtown Branch" -> "downtown-branch" */
function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createTenant(
  _prev: CreateTenantState,
  formData: FormData
): Promise<CreateTenantState> {
  // Only a superadmin may create a tenant (FR-7).
  const actor = await requireRole("SUPERADMIN");

  const parsed = createTenantSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        name: f.name?.[0],
        location: f.location?.[0],
        email: f.email?.[0],
        password: f.password?.[0],
      },
    };
  }

  const { name, location, email, password } = parsed.data;

  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { fieldErrors: { email: "That email is already in use." } };
  }

  // Names can repeat across locations, so make the slug unique on collision.
  const base = slugify(name) || "tenant";
  let slug = base;
  for (let n = 2; await db.tenant.findUnique({ where: { slug }, select: { id: true } }); n++) {
    slug = `${base}-${n}`;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // The tenant and its single login account are one unit - a tenant with no
  // way to sign in is not a provisioned system (FR-3, FR-4).
  await db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name, location, slug, createdById: actor.id },
    });

    await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "TENANT",
        tenantId: tenant.id,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "tenant.create",
        target: `Tenant:${tenant.id}`,
        tenantId: tenant.id,
        meta: { name, location, email },
      },
    });
  });

  revalidatePath("/superadmin");
  return { ok: true };
}
