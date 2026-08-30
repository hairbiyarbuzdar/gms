import { z } from "zod";

export const invoiceLineSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1),
});

export const createInvoiceSchema = z.object({
  lines: z.array(invoiceLineSchema).min(1, "Add at least one item."),
  discount: z.coerce.number().nonnegative("Discount cannot be negative.").default(0),
  paymentMethodId: z.string().trim().min(1, "Select a payment method."),
  memberId: z.string().trim().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
