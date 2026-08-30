import { TIME_ZONE } from "@/lib/format";

/**
 * Day and month boundaries in the tenant's timezone (Asia/Karachi).
 *
 * The server may run in any timezone, and Postgres stores UTC. Computing
 * "today" from the server's local midnight would put several hours of takings
 * in the wrong day, so the boundaries are derived from the wall-clock date in
 * Asia/Karachi and converted back to absolute instants.
 */

const partsFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The wall-clock date in the tenant's timezone, as { y, m, d }. */
function zonedParts(instant: Date) {
  const [year, month, day] = partsFormat.format(instant).split("-").map(Number);
  return { year, month, day };
}

/**
 * The UTC offset of the tenant's timezone at a given instant, in minutes.
 * Derived rather than hardcoded so it stays correct if the zone ever changes.
 */
function offsetMinutes(instant: Date): number {
  const utc = new Date(instant.toLocaleString("en-US", { timeZone: "UTC" }));
  const zoned = new Date(instant.toLocaleString("en-US", { timeZone: TIME_ZONE }));
  return (zoned.getTime() - utc.getTime()) / 60000;
}

/** Midnight of the given zoned date, as an absolute instant. */
function zonedMidnight(year: number, month: number, day: number, reference: Date): Date {
  const naiveUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  return new Date(naiveUtc - offsetMinutes(reference) * 60000);
}

export function startOfToday(now = new Date()): Date {
  const { year, month, day } = zonedParts(now);
  return zonedMidnight(year, month, day, now);
}

export function startOfTomorrow(now = new Date()): Date {
  const { year, month, day } = zonedParts(now);
  return zonedMidnight(year, month, day + 1, now);
}

export function startOfMonth(now = new Date()): Date {
  const { year, month } = zonedParts(now);
  return zonedMidnight(year, month, 1, now);
}

export function startOfNextMonth(now = new Date()): Date {
  const { year, month } = zonedParts(now);
  return month === 12
    ? zonedMidnight(year + 1, 1, 1, now)
    : zonedMidnight(year, month + 1, 1, now);
}

/** Midnight `days` from today - used for the "due this week" window. */
export function startOfDaysFromNow(days: number, now = new Date()): Date {
  const { year, month, day } = zonedParts(now);
  return zonedMidnight(year, month, day + days, now);
}
