import assert from "node:assert/strict";
import { test } from "node:test";
import type { PrismaClient } from "@/generated/prisma/client";
import { recordExpense } from "./record-expense";
import { getMethodBalance } from "./payment-method-balance";

const input = {
  tenantId: "tenant",
  categoryId: "category",
  paymentMethodId: "cash",
  amount: 40,
  description: null,
  spentAt: new Date(),
};

function ledger(opening: number, conflicts = 0) {
  let spent = 0;
  let attempts = 0;
  const aggregate = async () => ({ _sum: { amount: 0, total: 0 } });
  const tx = {
    auditLog: { create: async () => ({ id: "log" }) },
    expenseCategory: { findFirst: async () => ({ id: "category" }) },
    paymentMethod: { findFirst: async () => ({ id: "cash", openingBalance: opening }) },
    renewalPayment: { aggregate },
    retailInvoice: { aggregate },
    purchasePayment: { aggregate },
    paymentTransfer: { aggregate },
    expense: {
      aggregate: async () => ({ _sum: { amount: spent } }),
      create: async ({ data }: { data: typeof input }) => {
        spent += data.amount;
        return { id: "expense1", ...data };
      },
    },
  };
  const db = {
    ...tx,
    $transaction: async (
      fn: (client: typeof tx) => Promise<unknown>,
      options: { isolationLevel: string }
    ) => {
      assert.equal(options.isolationLevel, "Serializable");
      attempts++;
      const before = spent;
      const result = await fn(tx);
      if (attempts <= conflicts) {
        spent = before + 70; // Our debit rolls back; a competing debit commits.
        throw { code: "P2034" };
      }
      return result;
    },
  } as unknown as PrismaClient;
  return { db, attempts: () => attempts };
}

test("an expense deducts from the method's current balance", async () => {
  const { db } = ledger(100);
  assert.deepEqual(await recordExpense(db, input, "user1"), { ok: true });
  assert.equal(await getMethodBalance(db, "tenant", "cash"), 60);
});

test("an expense exceeding funds returns an error and leaves the balance unchanged", async () => {
  const { db } = ledger(30);
  const result = await recordExpense(db, input, "user1");
  assert.ok("fieldErrors" in result && result.fieldErrors.amount.includes("30.00"));
  assert.equal(await getMethodBalance(db, "tenant", "cash"), 30);
});

test("the exact available amount may be spent", async () => {
  const { db } = ledger(40);
  assert.deepEqual(await recordExpense(db, input, "user1"), { ok: true });
  assert.equal(await getMethodBalance(db, "tenant", "cash"), 0);
});

test("conflicting expenses recheck funds instead of overdrawing", async () => {
  const { db, attempts } = ledger(100, 1);
  const result = await recordExpense(db, input, "user1");
  assert.ok("fieldErrors" in result);
  assert.equal(attempts(), 2);
  assert.equal(await getMethodBalance(db, "tenant", "cash"), 30);
});
