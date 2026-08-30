import { z } from "zod";

export const createMembershipSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  phone: z.string().trim().min(1, "Phone is required.").max(30),
  email: z.union([z.string().trim().email("Enter a valid email."), z.literal("")]).optional(),
  packageId: z.string().trim().min(1, "Select a package."),
});

export const renewMembershipSchema = z.object({
  membershipId: z.string().trim().min(1),
  paymentMethodId: z.string().trim().min(1, "Select a payment method."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
});
