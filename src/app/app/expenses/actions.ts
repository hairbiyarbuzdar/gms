"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { tenantDb } from "@/lib/tenant-db";
import { getMethodBalance } from "@/lib/payment-method-balance";

const expenseSchema = z.object({
  categoryId: z.string().trim().min(1, "Choose a category."),
  amount: z.coerce
    .number({ error: "Enter a valid amount." })
    .positive("Amount must be greater than zero."),
  paymentMethodId: z.string().trim().min(1, "Choose a payment method."),
  description: z.string().trim().max(200).optional(),
  spentAt: z.string().trim().optional(),
});

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(60),
});

export type ExpenseState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Payment-method balances are derived from expenses, so recording one has to
 * refresh that page too.
 */
function revalidateAll() {
  revalidatePath("/app/expenses");
  revalidatePath("/app/payment-methods");
  revalidatePath("/app");
}

/** Records an operating cost (FR-37). Reduces the chosen method's balance. */
export async function createExpense(
  _prev: ExpenseState,
  formData: FormData
): Promise<ExpenseState> {
  const { db, tenantId } = await tenantDb();

  const parsed = expenseSchema.safeParse({
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    paymentMethodId: formData.get("paymentMethodId"),
    description: formData.get("description"),
    spentAt: formData.get("spentAt"),
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        categoryId: f.categoryId?.[0] ?? "",
        amount: f.amount?.[0] ?? "",
        paymentMethodId: f.paymentMethodId?.[0] ?? "",
      },
    };
  }

  const { categoryId, amount, paymentMethodId, description, spentAt } = parsed.data;

  // Both ids arrived from the client, so both are re-checked against this
  // tenant before anything is written.
  const [category, method] = await Promise.all([
    db.expenseCategory.findFirst({
      where: { id: categoryId, tenantId },
      select: { id: true },
    }),
    db.paymentMethod.findFirst({
      where: { id: paymentMethodId, tenantId, isActive: true },
      select: { id: true },
    }),
  ]);

  if (!category) return { fieldErrors: { categoryId: "That category is unavailable." } };
  if (!method) {
    return { fieldErrors: { paymentMethodId: "That payment method is unavailable." } };
  }

  // An expense cannot overdraw its method (one user per tenant, so a plain
  // pre-check is enough - no concurrent writer to race).
  const balance = await getMethodBalance(db, tenantId, paymentMethodId);
  if (amount > balance + 0.001) {
    return {
      fieldErrors: {
        amount: `Not enough funds. ${balance.toFixed(2)} available in that method.`,
      },
    };
  }

  await db.expense.create({
    data: {
      tenantId,
      categoryId,
      amount,
      paymentMethodId,
      description: description || null,
      spentAt: spentAt ? new Date(spentAt) : new Date(),
    },
  });

  revalidateAll();
  return { ok: true };
}

/** Removes an expense and returns the money to its payment method. */
export async function deleteExpense(
  _prev: ExpenseState,
  formData: FormData
): Promise<ExpenseState> {
  const { db, tenantId } = await tenantDb();

  const id = String(formData.get("id") ?? "");
  const existing = await db.expense.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return { error: "Expense not found." };

  await db.expense.delete({ where: { id } });

  revalidateAll();
  return { ok: true };
}

/** Expense categories are configurable per tenant (FR-38). */
export async function createCategory(
  _prev: ExpenseState,
  formData: FormData
): Promise<ExpenseState> {
  const { db, tenantId } = await tenantDb();

  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { fieldErrors: { name: parsed.error.flatten().fieldErrors.name?.[0] ?? "" } };
  }

  const { name } = parsed.data;

  const clash = await db.expenseCategory.findFirst({
    where: { tenantId, name },
    select: { id: true },
  });
  if (clash) return { fieldErrors: { name: "That category already exists." } };

  await db.expenseCategory.create({ data: { tenantId, name, isActive: true } });

  revalidatePath("/app/expenses");
  return { ok: true };
}
