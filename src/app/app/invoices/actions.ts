"use server";

import { revalidatePath } from "next/cache";
import { tenantDb } from "@/lib/tenant-db";
import { createInvoiceSchema } from "@/lib/validators/invoice";

export type SaleState = {
  ok?: boolean;
  error?: string;
  invoiceNumber?: string;
};

/**
 * INV-000123, sequential per tenant.
 *
 * The highest number must be found NUMERICALLY, not by sorting text:
 * "INV-1002" sorts above "INV-000123" as a string, so a text sort keeps
 * handing back a number that already exists. Padding alone does not fix it
 * either, since older rows may carry a different width.
 */
function highestSequence(numbers: string[]): number {
  return numbers.reduce((max, value) => {
    const digits = Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
    return Number.isNaN(digits) ? max : Math.max(max, digits);
  }, 0);
}

function formatNumber(sequence: number): string {
  return `INV-${String(sequence).padStart(6, "0")}`;
}

/**
 * Records a retail sale (FR-29, FR-30).
 *
 * Everything happens in one transaction: the invoice, its lines, the stock
 * decrements, and the stock-movement audit trail. A sale that reduced stock
 * without recording the invoice - or vice versa - would corrupt both the
 * inventory count and the cash report.
 *
 * Prices come from the database, never the client: a posted price would let
 * anyone sell at whatever figure they liked.
 */
export async function createSale(input: unknown): Promise<SaleState> {
  const { db, tenantId } = await tenantDb();

  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid sale." };
  }

  const { lines, discount, paymentMethodId, memberId } = parsed.data;

  // Collapse duplicate lines so stock checks see the true total per product.
  const wanted = new Map<string, number>();
  for (const line of lines) {
    wanted.set(line.productId, (wanted.get(line.productId) ?? 0) + line.quantity);
  }

  const productIds = [...wanted.keys()];

  const [products, method, member] = await Promise.all([
    db.product.findMany({
      where: { id: { in: productIds }, tenantId, isActive: true },
      select: { id: true, name: true, salePrice: true, quantity: true },
    }),
    db.paymentMethod.findFirst({
      where: { id: paymentMethodId, tenantId, isActive: true },
      select: { id: true },
    }),
    memberId
      ? db.member.findFirst({ where: { id: memberId, tenantId }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  if (!method) return { error: "That payment method is not available." };
  if (products.length !== productIds.length) {
    return { error: "One or more items are no longer available." };
  }
  if (memberId && !member) return { error: "That member was not found." };

  // Refuse to oversell rather than driving stock negative.
  for (const product of products) {
    const qty = wanted.get(product.id)!;
    if (product.quantity < qty) {
      return {
        error: `Not enough stock for ${product.name} — ${product.quantity} left.`,
      };
    }
  }

  const priced = products.map((product) => {
    const quantity = wanted.get(product.id)!;
    const unitPrice = Number(product.salePrice.toString());
    return { product, quantity, unitPrice, lineTotal: unitPrice * quantity };
  });

  const subtotal = priced.reduce((sum, line) => sum + line.lineTotal, 0);

  if (discount > subtotal) {
    return { error: "Discount cannot exceed the subtotal." };
  }

  const total = subtotal - discount;

  const invoiceNumber = await db.$transaction(async (tx) => {
    // Every number is read and compared numerically. A `orderBy: number desc`
    // would sort as text and pick the wrong row - see highestSequence above.
    const existing = await tx.retailInvoice.findMany({
      where: { tenantId },
      select: { number: true },
    });

    const number = formatNumber(highestSequence(existing.map((row) => row.number)) + 1);

    const invoice = await tx.retailInvoice.create({
      data: {
        tenantId,
        number,
        memberId: member?.id ?? null,
        subtotal,
        discount,
        total,
        paymentMethodId,
        lines: {
          create: priced.map((line) => ({
            tenantId,
            productId: line.product.id,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          })),
        },
      },
      select: { id: true, number: true },
    });

    for (const line of priced) {
      await tx.product.update({
        where: { id: line.product.id },
        data: { quantity: { decrement: line.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: line.product.id,
          quantityDelta: -line.quantity,
          type: "SALE",
          reference: `RetailInvoice:${invoice.id}`,
        },
      });
    }

    return invoice.number;
  });

  revalidatePath("/app/invoices");
  revalidatePath("/app/inventory");
  revalidatePath("/app");

  return { ok: true, invoiceNumber };
}
