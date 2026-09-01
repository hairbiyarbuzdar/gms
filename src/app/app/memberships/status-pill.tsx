import type { MembershipRow } from "./data";

/**
 * Derives the label from the due date rather than the stored status, so a
 * membership reads as overdue the moment it falls due.
 */
export function statusOf(row: Pick<MembershipRow, "status" | "daysUntilDue">) {
  if (row.status === "CANCELLED") return { label: "Cancelled", tone: "muted" as const };
  if (row.daysUntilDue < 0) {
    const days = Math.abs(row.daysUntilDue);
    return { label: `Overdue ${days}d`, tone: "danger" as const };
  }
  if (row.daysUntilDue === 0) return { label: "Due today", tone: "danger" as const };
  if (row.daysUntilDue <= 7) return { label: "Due soon", tone: "warning" as const };
  return { label: "Active", tone: "ok" as const };
}

const TONES = {
  danger: "bg-destructive text-white",
  warning: "bg-warning text-white",
  ok: "bg-success text-white",
  muted: "bg-secondary text-muted-foreground",
} as const;

export function StatusPill({ row }: { row: Pick<MembershipRow, "status" | "daysUntilDue"> }) {
  const { label, tone } = statusOf(row);
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${TONES[tone]}`}
    >
      {label}
    </span>
  );
}
