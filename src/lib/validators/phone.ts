import { z } from "zod";

/**
 * A phone number: exactly 11 digits, nothing else (e.g. 03001234567).
 *
 * Shared so every form - members, suppliers, anything added later - enforces
 * the same shape and stores the same normalized value.
 */
const ELEVEN_DIGITS = /^\d{11}$/;

/** Required 11-digit phone. */
export const phoneRequired = z
  .string()
  .trim()
  .regex(ELEVEN_DIGITS, "Phone must be exactly 11 digits.");

/** Optional 11-digit phone - empty string is allowed and normalized to "". */
export const phoneOptional = z
  .union([z.string().trim().regex(ELEVEN_DIGITS, "Phone must be exactly 11 digits."), z.literal("")])
  .optional();
