"use client";

import { useEffect, useState } from "react";
import { Mail, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatMoney } from "@/lib/format";
import type { MembershipRow } from "./data";
import { StatusPill } from "./status-pill";
import { getMemberPayments, type PaymentHistoryRow } from "./actions";

function formatCnic(digits: string | null): string | null {
  if (!digits) return null;
  return digits.length === 13
    ? `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
    : digits;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-[13px]">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{value}</dd>
    </div>
  );
}

export function MemberDetailsDialog({
  row,
  open,
  onOpenChange,
}: {
  row: MembershipRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [payments, setPayments] = useState<PaymentHistoryRow[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPayments(null);
    getMemberPayments(row.id).then((rows) => {
      if (!cancelled) setPayments(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [open, row.id]);

  const cnic = formatCnic(row.memberCnic);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Member details</DialogTitle>
          <DialogDescription>{row.memberName}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          {row.memberPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.memberPhotoUrl}
              alt={row.memberName}
              className="size-14 shrink-0 rounded object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded bg-secondary text-sm font-bold text-muted-foreground"
            >
              {initials(row.memberName)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.memberName}</p>
            <p className="data-mono truncate text-[12px] text-muted-foreground">
              {row.memberBarcode}
            </p>
            <div className="mt-0.5">
              <StatusPill row={row} />
            </div>
          </div>
        </div>

        <section>
          <p className="label-caps mb-1 text-muted-foreground">Contact</p>
          <dl className="divide-y divide-border rounded border border-border px-3 py-1">
            <Row
              label="Phone"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="data-mono">{row.memberPhone}</span>
                </span>
              }
            />
            <Row
              label="Email"
              value={
                row.memberEmail ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate">{row.memberEmail}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
            <Row
              label="CNIC"
              value={
                cnic ? (
                  <span className="data-mono">{cnic}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )
              }
            />
          </dl>
        </section>

        <section>
          <p className="label-caps mb-1 text-muted-foreground">Membership</p>
          <dl className="divide-y divide-border rounded border border-border px-3 py-1">
            <Row label="Package" value={row.packageName} />
            <Row
              label="Package fee"
              value={<span className="data-mono">{formatMoney(row.packagePrice)}</span>}
            />
            {row.extras.length > 0 && (
              <Row
                label="Extras"
                value={
                  <span>
                    {row.extras.map((x) => x.name).join(", ")}{" "}
                    <span className="data-mono text-muted-foreground">
                      ({formatMoney(row.extrasTotal)})
                    </span>
                  </span>
                }
              />
            )}
            <Row label="Joined" value={<span className="data-mono">{formatDate(row.joinDate)}</span>} />
            <Row
              label="Next renewal"
              value={<span className="data-mono">{formatDate(row.nextRenewalDate)}</span>}
            />
          </dl>
        </section>

        <section>
          <p className="label-caps mb-1 text-muted-foreground">Payment history</p>
          {payments === null ? (
            <p className="rounded border border-border bg-secondary px-3 py-2 text-[12px] text-muted-foreground">
              Loading…
            </p>
          ) : payments.length === 0 ? (
            <p className="rounded border border-border bg-secondary px-3 py-2 text-[12px] text-muted-foreground">
              No payments recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded border border-border">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                  <div className="min-w-0">
                    <p className="data-mono">{formatDate(new Date(p.recordedAt))}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(new Date(p.periodStart))} – {formatDate(new Date(p.periodEnd))} ·{" "}
                      {p.method}
                    </p>
                  </div>
                  <span className="data-mono shrink-0 font-medium">{formatMoney(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
