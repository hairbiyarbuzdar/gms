import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

function num(value: { toString(): string } | null | undefined): number {
  return value ? Number(value.toString()) : 0;
}

/**
 * The current balance of a single payment method.
 *
 * Same formula as getMethodBalances():
 *   opening + renewals + retail sales + transfers in
 *          - expenses - supplier payments - transfers out
 *
 * Kept as its own helper so an outflow can check funds before it writes,
 * inside the same transaction as the write.
 */
export async function getMethodBalance(
  db: Db,
  tenantId: string,
  methodId: string
): Promise<number> {
  const [method, renewals, sales, expenses, purchases, out, incoming] = await Promise.all([
    db.paymentMethod.findFirst({
      where: { id: methodId, tenantId },
      select: { openingBalance: true },
    }),
    db.renewalPayment.aggregate({
      where: { tenantId, paymentMethodId: methodId },
      _sum: { amount: true },
    }),
    db.retailInvoice.aggregate({
      where: { tenantId, paymentMethodId: methodId },
      _sum: { total: true },
    }),
    db.expense.aggregate({
      where: { tenantId, paymentMethodId: methodId },
      _sum: { amount: true },
    }),
    db.purchasePayment.aggregate({
      where: { tenantId, paymentMethodId: methodId },
      _sum: { amount: true },
    }),
    db.paymentTransfer.aggregate({
      where: { tenantId, fromMethodId: methodId },
      _sum: { amount: true },
    }),
    db.paymentTransfer.aggregate({
      where: { tenantId, toMethodId: methodId },
      _sum: { amount: true },
    }),
  ]);

  const opening = num(method?.openingBalance);
  const inflow = num(renewals._sum.amount) + num(sales._sum.total) + num(incoming._sum.amount);
  const outflow = num(expenses._sum.amount) + num(purchases._sum.amount) + num(out._sum.amount);

  return opening + inflow - outflow;
}
