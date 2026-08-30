"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { tenantDb } from "@/lib/tenant-db";

const methodSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(60),
  openingBalance: z.coerce
    .number({ error: "Enter a valid amount." })
    .min(-9_999_999_999, "Amount is too small.")
    .max(9_999_999_999, "Amount is too large."),
});

const transferSchema = z.object({
  fromMethodId: z.string().trim().min(1, "Choose where the money is coming from."),
  toMethodId: z.string().trim().min(1, "Choose where the money is going."),
  amount: z.coerce
    .number({ error: "Enter a valid amount." })
    .positive("Amount must be greater than zero."),
  note: z.string().trim().max(200).optional(),
});

export type MethodState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** Every money path revalidates: a balance shown here is derived from them. */
function revalidateAll() {
  revalidatePath("/app/payment-methods");
  revalidatePath("/app/invoices");
  revalidatePath("/app/memberships");
  revalidatePath("/app");
}

export async function createPaymentMethod(
  _prev: MethodState,
  formData: FormData
): Promise<MethodState> {
  const { db, tenantId } = await tenantDb();

  const parsed = methodSchema.safeParse({
    name: formData.get("name"),
    openingBalance: formData.get("openingBalance") || 0,
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        name: f.name?.[0] ?? "",
        openingBalance: f.openingBalance?.[0] ?? "",
      },
    };
  }

  const { name, openingBalance } = parsed.data;

  const clash = await db.paymentMethod.findFirst({
    where: { tenantId, name },
    select: { id: true },
  });
  if (clash) return { fieldErrors: { name: "That method already exists." } };

  await db.paymentMethod.create({
    data: { tenantId, name, openingBalance, isActive: true },
  });

  revalidateAll();
  return { ok: true };
}

export async function updatePaymentMethod(
  _prev: MethodState,
  formData: FormData
): Promise<MethodState> {
  const { db, tenantId } = await tenantDb();

  const id = String(formData.get("id") ?? "");
  const parsed = methodSchema.safeParse({
    name: formData.get("name"),
    openingBalance: formData.get("openingBalance") || 0,
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        name: f.name?.[0] ?? "",
        openingBalance: f.openingBalance?.[0] ?? "",
      },
    };
  }

  const { name, openingBalance } = parsed.data;

  const existing = await db.paymentMethod.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return { error: "Payment method not found." };

  const clash = await db.paymentMethod.findFirst({
    where: { tenantId, name, id: { not: id } },
    select: { id: true },
  });
  if (clash) return { fieldErrors: { name: "That method already exists." } };

  await db.paymentMethod.update({ where: { id }, data: { name, openingBalance } });

  revalidateAll();
  return { ok: true };
}

/**
 * Archives or restores a method.
 *
 * Never deleted: renewals, sales, expenses, supplier payments and transfers all
 * reference one, and removing it would break every historical record and the
 * cash report.
 */
export async function togglePaymentMethod(
  _prev: MethodState,
  formData: FormData
): Promise<MethodState> {
  const { db, tenantId } = await tenantDb();

  const id = String(formData.get("id") ?? "");
  const existing = await db.paymentMethod.findFirst({
    where: { id, tenantId },
    select: { id: true, isActive: true },
  });
  if (!existing) return { error: "Payment method not found." };

  await db.paymentMethod.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  revalidateAll();
  return { ok: true };
}

/**
 * Moves money between two of the tenant's own channels.
 *
 * Not income and not an expense - the same money leaves one balance and lands
 * in another, so revenue and expense reporting are untouched.
 */
export async function createTransfer(
  _prev: MethodState,
  formData: FormData
): Promise<MethodState> {
  const { db, tenantId } = await tenantDb();

  const parsed = transferSchema.safeParse({
    fromMethodId: formData.get("fromMethodId"),
    toMethodId: formData.get("toMethodId"),
    amount: formData.get("amount"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        fromMethodId: f.fromMethodId?.[0] ?? "",
        toMethodId: f.toMethodId?.[0] ?? "",
        amount: f.amount?.[0] ?? "",
      },
    };
  }

  const { fromMethodId, toMethodId, amount, note } = parsed.data;

  if (fromMethodId === toMethodId) {
    return { fieldErrors: { toMethodId: "Pick a different destination." } };
  }

  // Both ids came from the client, so both are re-checked against this tenant.
  const [from, to] = await Promise.all([
    db.paymentMethod.findFirst({ where: { id: fromMethodId, tenantId }, select: { id: true } }),
    db.paymentMethod.findFirst({ where: { id: toMethodId, tenantId }, select: { id: true } }),
  ]);

  if (!from || !to) return { error: "One of those methods is unavailable." };

  await db.paymentTransfer.create({
    data: { tenantId, fromMethodId, toMethodId, amount, note: note || null },
  });

  revalidateAll();
  return { ok: true };
}

/**
 * Removes a transfer outright.
 *
 * Unlike a method, a transfer is a standalone record nothing else references,
 * so deleting it simply reverses both balances - which is what correcting a
 * mistyped transfer should do.
 */
export async function deleteTransfer(
  _prev: MethodState,
  formData: FormData
): Promise<MethodState> {
  const { db, tenantId } = await tenantDb();

  const id = String(formData.get("id") ?? "");
  const existing = await db.paymentTransfer.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return { error: "Transfer not found." };

  await db.paymentTransfer.delete({ where: { id } });

  revalidateAll();
  return { ok: true };
}
