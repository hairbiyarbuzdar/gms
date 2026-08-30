import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * A single dashboard figure.
 *
 * Per the design system: label-caps title, large value, no shadows, 1px
 * border, and maroon reserved for figures that need action.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  /** Draws the eye when the number needs acting on (overdue, low stock). */
  emphasis?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="label-caps text-muted-foreground">{label}</p>
        <Icon
          className={`size-4 shrink-0 ${emphasis ? "text-primary" : "text-muted-foreground/50"}`}
          aria-hidden="true"
        />
      </div>
      <p
        className={`mt-3 text-3xl font-bold tracking-tight tabular-nums ${
          emphasis ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">{hint}</p>}
    </>
  );

  const className =
    "block rounded-lg border border-border bg-card p-5 transition-colors" +
    (href ? " hover:border-primary" : "");

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
