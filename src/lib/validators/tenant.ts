import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  location: z.string().trim().min(1, "Location is required.").max(200),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
