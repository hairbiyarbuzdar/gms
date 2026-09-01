import { z } from "zod";
import { phoneRequired } from "./phone";

export const createMembershipSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  phone: phoneRequired,
  email: z.union([z.string().trim().email("Enter a valid email."), z.literal("")]).optional(),
  /** 13 digits, dashes stripped by the client. Optional. */
  cnic: z
    .union([z.string().trim().regex(/^\d{13}$/, "CNIC must be 13 digits."), z.literal("")])
    .optional(),
  joinDate: z.string().trim().optional(),
  packageId: z.string().trim().min(1, "Select a package."),
  /** data: URL from the webcam capture, or empty. Validated server-side. */
  photo: z.string().trim().optional(),
});

export const renewMembershipSchema = z.object({
  membershipId: z.string().trim().min(1),
  paymentMethodId: z.string().trim().min(1, "Select a payment method."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
});
