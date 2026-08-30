import type { Prisma } from "@/generated/prisma/client";

/** The platform runs in a single locale and currency (decision D-11). */
export const LOCALE = "en-PK";
export const CURRENCY = "PKR";
export const TIME_ZONE = "Asia/Karachi";

const currencyFormat = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const currencyFormatPrecise = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

type Money = Prisma.Decimal | number | string | null | undefined;

function toNumber(value: Money): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

/** Rs 12,500 - rounded, for headline figures. */
export function formatMoney(value: Money): string {
  return currencyFormat.format(toNumber(value));
}

/** Rs 12,500.00 - for invoice lines and totals. */
export function formatMoneyPrecise(value: Money): string {
  return currencyFormatPrecise.format(toNumber(value));
}

export function formatDate(value: Date): string {
  return dateFormat.format(value);
}
