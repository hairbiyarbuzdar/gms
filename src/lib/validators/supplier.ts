import { z } from "zod";
import { phoneOptional } from "./phone";

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  phone: phoneOptional,
  email: z.union([z.string().trim().email("Enter a valid email."), z.literal("")]).optional(),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateSupplierSchema = supplierSchema.extend({
  id: z.string().trim().min(1),
});

const purchaseLineSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  /** What the supplier charged per unit. */
  unitCost: z.coerce.number().nonnegative("Cost cannot be negative."),
  /** The sale price to set on the product when this invoice is posted. */
  unitSalePrice: z.coerce.number().nonnegative("Sale price cannot be negative."),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().trim().min(1, "Select a supplier."),
  reference: z.string().trim().max(60).optional(),
  invoiceDate: z.string().trim().optional(),
  lines: z.array(purchaseLineSchema).min(1, "Add at least one product."),
  /**
   * Chosen only when the invoice is paid now. An amount of 0 means "recorded
   * but not paid", so no method is required.
   */
  paymentMethodId: z.string().trim().optional(),
  amountPaid: z.coerce.number().nonnegative("Amount paid cannot be negative.").default(0),
});

export const addPurchasePaymentSchema = z.object({
  purchaseInvoiceId: z.string().trim().min(1),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  paymentMethodId: z.string().trim().min(1, "Select a payment method."),
});
