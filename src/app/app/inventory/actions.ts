"use server";

import { revalidatePath } from "next/cache";
import { tenantDb } from "@/lib/tenant-db";
import {
  adjustStockSchema,
  productSchema,
  updateProductSchema,
} from "@/lib/validators/product";

export type ProductState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Set after a successful create, so the caller can offer a shelf label. */
  created?: { name: string; code: string; category: string | null };
};

function fields(error: { flatten(): { fieldErrors: Record<string, string[] | undefined> } }) {
  const f = error.flatten().fieldErrors;
  return {
    name: f.name?.[0] ?? "",
    sku: f.sku?.[0] ?? "",
    category: f.category?.[0] ?? "",
    salePrice: f.salePrice?.[0] ?? "",
    quantity: f.quantity?.[0] ?? "",
    reorderLevel: f.reorderLevel?.[0] ?? "",
  };
}

/** Adds a retail product (FR-24). Opening stock is recorded as a movement. */
export async function createProduct(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const { db, tenantId } = await tenantDb();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    category: formData.get("category"),
    salePrice: formData.get("salePrice"),
    quantity: formData.get("quantity"),
    reorderLevel: formData.get("reorderLevel"),
  });

  if (!parsed.success) return { fieldErrors: fields(parsed.error) };

  const { name, sku, category, salePrice, quantity, reorderLevel } = parsed.data;

  if (sku) {
    const clash = await db.product.findFirst({
      where: { tenantId, sku },
      select: { id: true },
    });
    if (clash) return { fieldErrors: { sku: "That SKU is already in use." } };
  }

  const serial = await db.$transaction(async (tx) => {
    // Next serial for this tenant, starting at 1. Derived inside the
    // transaction so two concurrent creates cannot read the same value; the
    // unique index on (tenantId, serial) rejects a collision if they do.
    const last = await tx.product.findFirst({
      where: { tenantId },
      orderBy: { serial: "desc" },
      select: { serial: true },
    });

    const product = await tx.product.create({
      data: {
        tenantId,
        serial: (last?.serial ?? 0) + 1,
        name,
        sku: sku || null,
        category: category || null,
        salePrice,
        quantity,
        reorderLevel,
      },
    });

    // Stock never changes without a movement behind it (FR-26).
    if (quantity > 0) {
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: product.id,
          quantityDelta: quantity,
          type: "ADJUSTMENT",
          reason: "Opening stock",
        },
      });
    }

    return product.serial;
  });

  revalidatePath("/app/inventory");
  revalidatePath("/app/invoices");
  return {
    ok: true,
    // Label the SKU when there is one; otherwise the serial, so every product
    // still gets something scannable.
    created: { name, code: sku || String(serial), category: category || null },
  };
}

/**
 * Edits a product's details.
 *
 * Quantity is deliberately not editable here - stock moves only through
 * documented adjustments, sales, and purchases, so the movement history
 * always explains the current count.
 */
export async function updateProduct(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const { db, tenantId } = await tenantDb();

  const parsed = updateProductSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    sku: formData.get("sku"),
    category: formData.get("category"),
    salePrice: formData.get("salePrice"),
    quantity: formData.get("quantity"),
    reorderLevel: formData.get("reorderLevel"),
  });

  if (!parsed.success) return { fieldErrors: fields(parsed.error) };

  const { id, name, sku, category, salePrice, reorderLevel } = parsed.data;

  const existing = await db.product.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return { error: "Product not found." };

  if (sku) {
    const clash = await db.product.findFirst({
      where: { tenantId, sku, id: { not: id } },
      select: { id: true },
    });
    if (clash) return { fieldErrors: { sku: "That SKU is already in use." } };
  }

  await db.product.update({
    where: { id },
    data: { name, sku: sku || null, category: category || null, salePrice, reorderLevel },
  });

  revalidatePath("/app/inventory");
  revalidatePath("/app/invoices");
  return { ok: true };
}

/** Records a manual stock correction with a reason (FR-27). */
export async function adjustStock(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const { db, tenantId } = await tenantDb();

  const parsed = adjustStockSchema.safeParse({
    id: formData.get("id"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { delta: f.delta?.[0] ?? "", reason: f.reason?.[0] ?? "" } };
  }

  const { id, delta, reason } = parsed.data;

  if (delta === 0) return { fieldErrors: { delta: "Enter a non-zero amount." } };

  const product = await db.product.findFirst({
    where: { id, tenantId },
    select: { id: true, quantity: true },
  });
  if (!product) return { error: "Product not found." };

  if (product.quantity + delta < 0) {
    return { fieldErrors: { delta: `Only ${product.quantity} in stock.` } };
  }

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: { quantity: { increment: delta } },
    });

    await tx.stockMovement.create({
      data: { tenantId, productId: id, quantityDelta: delta, type: "ADJUSTMENT", reason },
    });
  });

  revalidatePath("/app/inventory");
  revalidatePath("/app/invoices");
  revalidatePath("/app");
  return { ok: true };
}

/** Hides a product from the catalogue without losing its sales history. */
export async function toggleProduct(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const { db, tenantId } = await tenantDb();

  const id = String(formData.get("id") ?? "");
  const existing = await db.product.findFirst({
    where: { id, tenantId },
    select: { id: true, isActive: true },
  });
  if (!existing) return { error: "Product not found." };

  await db.product.update({ where: { id }, data: { isActive: !existing.isActive } });

  revalidatePath("/app/inventory");
  revalidatePath("/app/invoices");
  return { ok: true };
}
