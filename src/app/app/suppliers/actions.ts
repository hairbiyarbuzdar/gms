"use server";

import { revalidatePath } from "next/cache";
import { tenantDb } from "@/lib/tenant-db";
import { getMethodBalance } from "@/lib/payment-method-balance";
import {
  addPurchasePaymentSchema,
  createPurchaseSchema,
  supplierSchema,
  updateSupplierSchema,
} from "@/lib/validators/supplier";

export type SupplierState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Purchase payments feed payment-method balances and the cash report, so a
 * change here has to refresh those views too.
 */
function revalidateAll() {
  revalidatePath("/app/suppliers");
  revalidatePath("/app/inventory");
  revalidatePath("/app/payment-methods");
  revalidatePath("/app");
}

/** Rolls the invoice status up from how much has been paid against it. */
function statusFor(total: number, paid: number): "UNPAID" | "PARTIAL" | "PAID" {
  if (paid <= 0) return "UNPAID";
  if (paid >= total) return "PAID";
  return "PARTIAL";
}

function supplierFieldErrors(error: {
  flatten(): { fieldErrors: Record<string, string[] | undefined> };
}) {
  const f = error.flatten().fieldErrors;
  return {
    name: f.name?.[0] ?? "",
    phone: f.phone?.[0] ?? "",
    email: f.email?.[0] ?? "",
    address: f.address?.[0] ?? "",
    notes: f.notes?.[0] ?? "",
  };
}

export async function createSupplier(
  _prev: SupplierState,
  formData: FormData
): Promise<SupplierState> {
  const { db, tenantId } = await tenantDb();

  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) return { fieldErrors: supplierFieldErrors(parsed.error) };

  const { name, phone, email, address, notes } = parsed.data;

  await db.supplier.create({
    data: {
      tenantId,
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
    },
  });

  revalidatePath("/app/suppliers");
  return { ok: true };
}

export async function updateSupplier(
  _prev: SupplierState,
  formData: FormData
): Promise<SupplierState> {
  const { db, tenantId } = await tenantDb();

  const parsed = updateSupplierSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) return { fieldErrors: supplierFieldErrors(parsed.error) };

  const { id, name, phone, email, address, notes } = parsed.data;

  const existing = await db.supplier.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return { error: "Supplier not found." };

  await db.supplier.update({
    where: { id },
    data: {
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
    },
  });

  revalidatePath("/app/suppliers");
  return { ok: true };
}

/**
 * Records a purchase invoice (FR-34).
 *
 * Posting it increases stock quantity for each line - and nothing else. The
 * line amount is what the supplier charged; it is never written back to the
 * product's sale price (FR-35, decision D-8).
 *
 * A payment method is required only when money is actually paid now. An
 * amount of 0 records the invoice as unpaid, with no method.
 */
export async function createPurchase(input: unknown): Promise<SupplierState> {
  const { db, tenantId } = await tenantDb();

  const parsed = createPurchaseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid purchase." };
  }

  const { supplierId, reference, invoiceDate, lines, paymentMethodId, amountPaid } =
    parsed.data;

  const supplier = await db.supplier.findFirst({
    where: { id: supplierId, tenantId },
    select: { id: true },
  });
  if (!supplier) return { error: "That supplier is unavailable." };

  // Collapse duplicate product lines so stock is bumped once per product. The
  // cost and sale price of the last line for a product win.
  const byProduct = new Map<
    string,
    { quantity: number; unitCost: number; unitSalePrice: number }
  >();
  for (const line of lines) {
    const current = byProduct.get(line.productId);
    byProduct.set(line.productId, {
      quantity: (current?.quantity ?? 0) + line.quantity,
      unitCost: line.unitCost,
      unitSalePrice: line.unitSalePrice,
    });
  }

  const productIds = [...byProduct.keys()];
  const products = await db.product.findMany({
    where: { id: { in: productIds }, tenantId },
    select: { id: true },
  });
  if (products.length !== productIds.length) {
    return { error: "One or more products are no longer available." };
  }

  const total = [...byProduct.values()].reduce(
    (sum, l) => sum + l.quantity * l.unitCost,
    0
  );
  const paid = Math.min(amountPaid, total);

  if (amountPaid > 0 && !paymentMethodId) {
    return { error: "Choose a payment method for the amount paid." };
  }

  let method = null;
  if (paid > 0 && paymentMethodId) {
    method = await db.paymentMethod.findFirst({
      where: { id: paymentMethodId, tenantId, isActive: true },
      select: { id: true },
    });
    if (!method) return { error: "That payment method is unavailable." };

    const balance = await getMethodBalance(db, tenantId, paymentMethodId);
    if (paid > balance + 0.001) {
      return {
        error: `Not enough funds in that method - ${balance.toFixed(2)} available, ${paid.toFixed(2)} to pay.`,
      };
    }
  }

  await db.$transaction(async (tx) => {
    const invoice = await tx.purchaseInvoice.create({
      data: {
        tenantId,
        supplierId,
        reference: reference || null,
        total,
        status: statusFor(total, paid),
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        lines: {
          create: [...byProduct.entries()].map(([productId, l]) => ({
            tenantId,
            productId,
            quantity: l.quantity,
            unitCost: l.unitCost,
            unitSalePrice: l.unitSalePrice,
          })),
        },
      },
      select: { id: true },
    });

    // Stock never moves without a documented movement behind it (FR-26). The
    // purchase also carries the product's cost and its new sale price.
    for (const [productId, l] of byProduct.entries()) {
      await tx.product.update({
        where: { id: productId },
        data: {
          quantity: { increment: l.quantity },
          costPrice: l.unitCost,
          salePrice: l.unitSalePrice,
        },
      });
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId,
          quantityDelta: l.quantity,
          type: "PURCHASE",
          reference: `PurchaseInvoice:${invoice.id}`,
        },
      });
    }

    if (paid > 0 && method) {
      await tx.purchasePayment.create({
        data: {
          tenantId,
          purchaseInvoiceId: invoice.id,
          amount: paid,
          paymentMethodId: method.id,
        },
      });
    }
  });

  revalidateAll();
  return { ok: true };
}

/** Records a later payment against an outstanding invoice. */
export async function addPurchasePayment(
  _prev: SupplierState,
  formData: FormData
): Promise<SupplierState> {
  const { db, tenantId } = await tenantDb();

  const parsed = addPurchasePaymentSchema.safeParse({
    purchaseInvoiceId: formData.get("purchaseInvoiceId"),
    amount: formData.get("amount"),
    paymentMethodId: formData.get("paymentMethodId"),
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        amount: f.amount?.[0] ?? "",
        paymentMethodId: f.paymentMethodId?.[0] ?? "",
      },
    };
  }

  const { purchaseInvoiceId, amount, paymentMethodId } = parsed.data;

  const [invoice, method] = await Promise.all([
    db.purchaseInvoice.findFirst({
      where: { id: purchaseInvoiceId, tenantId },
      select: { id: true, total: true, payments: { select: { amount: true } } },
    }),
    db.paymentMethod.findFirst({
      where: { id: paymentMethodId, tenantId, isActive: true },
      select: { id: true },
    }),
  ]);

  if (!invoice) return { error: "Invoice not found." };
  if (!method) return { fieldErrors: { paymentMethodId: "That payment method is unavailable." } };

  const total = Number(invoice.total.toString());
  const alreadyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount.toString()), 0);

  if (alreadyPaid + amount > total + 0.001) {
    return { fieldErrors: { amount: `Only ${(total - alreadyPaid).toFixed(2)} outstanding.` } };
  }

  const balance = await getMethodBalance(db, tenantId, paymentMethodId);
  if (amount > balance + 0.001) {
    return {
      fieldErrors: {
        amount: `Not enough funds. ${balance.toFixed(2)} available in that method.`,
      },
    };
  }

  await db.$transaction(async (tx) => {
    await tx.purchasePayment.create({
      data: { tenantId, purchaseInvoiceId, amount, paymentMethodId },
    });
    await tx.purchaseInvoice.update({
      where: { id: purchaseInvoiceId },
      data: { status: statusFor(total, alreadyPaid + amount) },
    });
  });

  revalidateAll();
  return { ok: true };
}
