"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowRight, History, Trash2 } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import type { TransferRange, TransferRow } from "./data";
import { deleteTransfer, type MethodState } from "./actions";

const RANGES: { key: TransferRange; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

function DeleteSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title="Delete transfer"
      className="rounded border border-border p-1.5 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
    >
      <Trash2 className="size-3.5" aria-hidden="true" />
      <span className="sr-only">Delete transfer</span>
    </button>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [, action] = useActionState<MethodState, FormData>(deleteTransfer, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <DeleteSubmit />
    </form>
  );
}

export function TransferHistory({
  transfers,
  range,
}: {
  transfers: TransferRow[];
  range: TransferRange;
}) {
  const total = transfers.reduce((sum, t) => sum + t.amount, 0);

  return (
    <section className="mt-8" aria-labelledby="transfers">
      <div className="mb-3 flex items-center gap-3">
        <History className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 id="transfers" className="label-caps text-muted-foreground">
          Transfer history
        </h2>
        <div className="h-px flex-1 bg-border" />
        <span className="data-mono text-[13px] text-muted-foreground">{transfers.length}</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex flex-wrap gap-1">
            {RANGES.map((r) => (
              <Link
                key={r.key}
                href={`/app/payment-methods?range=${r.key}`}
                aria-current={range === r.key ? "page" : undefined}
                className={`rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  range === r.key
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {r.label}
              </Link>
            ))}
          </div>
          <p className="text-[13px] text-muted-foreground">
            Total: <span className="data-mono text-foreground">{formatMoney(total)}</span>
          </p>
        </div>

        {transfers.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">
            No transfers in this period.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {transfers.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="data-mono w-28 shrink-0 text-[13px] text-muted-foreground">
                  {formatDate(t.transferredAt)}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                  <span className="truncate font-medium">{t.fromName}</span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate font-medium">{t.toName}</span>
                </span>
                {t.note && (
                  <span className="hidden truncate text-[13px] text-muted-foreground sm:block">
                    {t.note}
                  </span>
                )}
                <span className="data-mono shrink-0 text-sm font-semibold">
                  {formatMoney(t.amount)}
                </span>
                <DeleteButton id={t.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
