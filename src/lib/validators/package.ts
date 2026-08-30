import { z } from "zod";

export const createPackageSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  price: z.coerce
    .number({ error: "Enter a valid amount." })
    .nonnegative("Amount cannot be negative.")
    .max(9_999_999_999, "Amount is too large."),
  durationMonths: z.coerce
    .number({ error: "Enter a valid duration." })
    .int("Duration must be a whole number of months.")
    .min(1, "Duration must be at least 1 month.")
    .max(60, "Duration cannot exceed 60 months."),
});

export const updatePackageSchema = createPackageSchema.extend({
  id: z.string().trim().min(1),
  isActive: z.coerce.boolean().optional(),
});
