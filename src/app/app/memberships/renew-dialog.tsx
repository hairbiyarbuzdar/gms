"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { addMonths, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import { renewMembership, type ActionState } from "./actions";

const inputClass =
  "w-full rounded border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-destructive";

type PaymentMethod = { id: string; name: string };
type Extra = { id: string; name: string; fee: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Recording…" : "Record renewal"}
    </button>
  );
}

export function RenewDialog({
  membershipId,
  memberName,
  packageFee,
  extras,
  paymentMethods,
  open,
  onOpenChange,
}: {
  membershipId: string;
  memberName: string;
  packageFee: string;
  extras: Extra[];
  paymentMethods: PaymentMethod[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(renewMembership, {});

  useEffect(() => {
    if (state.ok) onOpenChange(false);
  }, [state.ok, onOpenChange]);

  // The schedule moves to one month from today, not from the old due date.
  const nextDue = addMonths(new Date(), 1);

  // Prefill the amount with package fee + every extra. The operator can still
  // adjust it before recording.
  const extrasTotal = extras.reduce((sum, x) => sum + Number(x.fee), 0);
  const defaultAmount = String(Number(packageFee) + extrasTotal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Renew membership</DialogTitle>
          <DialogDescription>{memberName}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="membershipId" value={membershipId} />

          {state.error && (
            <div
              role="alert"
              className="rounded border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[13px] text-destructive"
            >
              {state.error}
            </div>
          )}

          {extras.length > 0 && (
            <dl className="rounded border border-border bg-secondary/50 px-3 py-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Package fee</dt>
                <dd className="data-mono">{formatMoney(packageFee)}</dd>
              </div>
              {extras.map((x) => (
                <div key={x.id} className="flex justify-between">
                  <dt className="text-muted-foreground">{x.name}</dt>
                  <dd className="data-mono">{formatMoney(x.fee)}</dd>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t border-border pt-1 font-medium">
                <dt>Total</dt>
                <dd className="data-mono">{formatMoney(defaultAmount)}</dd>
              </div>
            </dl>
          )}

          <div className="flex flex-col">
            <label htmlFor="amount" className="label-caps mb-1 text-muted-foreground">
              Amount (PKR)
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              autoFocus
              defaultValue={defaultAmount}
              aria-invalid={state.fieldErrors?.amount ? true : undefined}
              className={inputClass}
            />
            {state.fieldErrors?.amount && (
              <p className="mt-1 text-[13px] text-destructive">{state.fieldErrors.amount}</p>
            )}
          </div>

          <div className="flex flex-col">
            <label htmlFor="paymentMethodId" className="label-caps mb-1 text-muted-foreground">
              Payment method
            </label>
            <select
              id="paymentMethodId"
              name="paymentMethodId"
              required
              defaultValue={paymentMethods[0]?.id}
              aria-invalid={state.fieldErrors?.paymentMethodId ? true : undefined}
              className={inputClass}
            >
              {paymentMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {state.fieldErrors?.paymentMethodId && (
              <p className="mt-1 text-[13px] text-destructive">
                {state.fieldErrors.paymentMethodId}
              </p>
            )}
          </div>

          <p className="rounded border border-border bg-secondary px-3 py-2.5 text-[13px] leading-[18px] text-muted-foreground">
            Next renewal moves to <strong>{format(nextDue, "dd MMM yyyy")}</strong> — one month
            from today, not from the previous due date.
          </p>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Cancel
            </button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
