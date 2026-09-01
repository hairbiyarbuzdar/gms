import { z } from "zod";

export const createPackageSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  /** Shown in the form as "Fee". Recorded as the payment on each renewal. */
  price: z.coerce
    .number({ error: "Enter a valid fee." })
    .nonnegative("Fee cannot be negative.")
    .max(9_999_999_999, "Fee is too large."),
  whatsIncluded: z.string().trim().max(500).optional(),
  // Kept out of the form; new packages default to 1 month.
  durationMonths: z.coerce.number().int().min(1).max(60).optional().default(1),
});

export const updatePackageSchema = createPackageSchema.extend({
  id: z.string().trim().min(1),
  isActive: z.coerce.boolean().optional(),
});
