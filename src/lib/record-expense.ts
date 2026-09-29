import type { PrismaClient } from "@/generated/prisma/client";
import { getMethodBalance } from "./payment-method-balance";

type ExpenseInput = {
  tenantId: string;
  categoryId: string;
  paymentMethodId: string;
  amount: number;
  description: string | null;
  spentAt: Date;
};

type Result = { ok: true } | { fieldErrors: Record<string, string> } | { error: string };

/** The expense itself is the debit in the payment method's ledger. */
export async function recordExpense(db: PrismaClient, data: ExpenseInput): Promise<Result> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(
        async (tx): Promise<Result> => {
          const { tenantId, categoryId, paymentMethodId, amount } = data;
          const category = await tx.expenseCategory.findFirst({
            where: { id: categoryId, tenantId, isActive: true },
            select: { id: true },
          });
          if (!category) return { fieldErrors: { categoryId: "That category is unavailable." } };

          const method = await tx.paymentMethod.findFirst({
            where: { id: paymentMethodId, tenantId, isActive: true },
            select: { id: true },
          });
          if (!method)
            return { fieldErrors: { paymentMethodId: "That payment method is unavailable." } };

          const balance = await getMethodBalance(tx, tenantId, paymentMethodId);
          // Compare in paisa to avoid floating-point noise at the exact balance.
          if (Math.round(amount * 100) > Math.round(balance * 100)) {
            return {
              fieldErrors: {
                amount: `Not enough funds. ${balance.toFixed(2)} available in that method.`,
              },
            };
          }

          await tx.expense.create({ data });
          return { ok: true };
        },
        { isolationLevel: "Serializable" }
      );
    } catch (error) {
      // A competing expense may consume the funds after our read. Retry the
      // entire transaction so the funds check sees the newly committed balance.
      if (!(error && typeof error === "object" && "code" in error && error.code === "P2034")) {
        throw error;
      }
    }
  }
  return { error: "The balance changed while saving. Please try again." };
}
