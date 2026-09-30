import assert from "node:assert/strict";
import { test } from "node:test";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { activityTransaction } from "./activity-write";

test("successful changes log the actor and gym without copying private fields", async () => {
  let saved: unknown;
  const tx = {
    auditLog: {
      create: async ({ data }: { data: unknown }) => {
        saved = data;
      },
    },
  } as unknown as Prisma.TransactionClient;
  const db = {
    $transaction: async (work: (client: Prisma.TransactionClient) => Promise<unknown>) => work(tx),
  } as unknown as PrismaClient;
  const record = {
    id: "member1",
    name: "Ali",
    number: "IR123456",
    email: "private@example.com",
    passwordHash: "secret",
    photoUrl: "private-photo",
  };
  const result = await activityTransaction(
    db,
    { tenantId: "gym1", actorId: "operator1", action: "MEMBERSHIP_CREATE" },
    async () => record
  );
  assert.equal(result, record);
  assert.deepEqual(saved, {
    tenantId: "gym1",
    actorId: "operator1",
    action: "MEMBERSHIP_CREATE",
    target: "member1",
    meta: { name: "Ali", number: "IR123456" },
  });
});

test("failed changes never log success; failed logging rolls back the change", async () => {
  let written = false;
  let logs = 0;
  let failLog = false;
  const tx = {
    auditLog: {
      create: async () => {
        if (failLog) throw new Error("Audit write failed");
        logs++;
      },
    },
  } as unknown as Prisma.TransactionClient;
  const db = {
    $transaction: async (work: (client: Prisma.TransactionClient) => Promise<unknown>) => {
      const before = written;
      try {
        return await work(tx);
      } catch (error) {
        written = before;
        throw error;
      }
    },
  } as unknown as PrismaClient;
  const context = { tenantId: "gym1", actorId: "operator1", action: "RETAIL_INVOICE_CREATE" };
  await assert.rejects(
    activityTransaction(db, context, async () => {
      throw new Error("Sale rejected");
    }),
    /Sale rejected/
  );
  assert.equal(logs, 0);
  failLog = true;
  await assert.rejects(
    activityTransaction(db, context, async () => {
      written = true;
      return { id: "invoice1" };
    }),
    /Audit write failed/
  );
  assert.equal(written, false);
  assert.equal(logs, 0);
});
