"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import { addPurchasePayment, type SupplierState } from "./actions";
import type { MethodOption } from "./data";

const inputClass =
  "w-full rounded border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-destructive";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Recording…" : "Record payment"}
    </button>
  );
}

export function PayInvoiceDialog({
  invoiceId,
  supplierName,
  outstanding,
  methods,
}: {
  invoiceId: string;
  supplierName: string;
  outstanding: number;
  methods: MethodOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<SupplierState, FormData>(addPurchasePayment, {});

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="rounded border border-border px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          Pay
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {supplierName} — {formatMoney(outstanding)} outstanding
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="purchaseInvoiceId" value={invoiceId} />

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
              max={outstanding}
              required
              autoFocus
              defaultValue={outstanding}
              aria-invalid={state.fieldErrors?.amount ? true : undefined}
              className={inputClass}
            />
            {state.fieldErrors?.amount && (
              <p className="mt-1 text-[13px] text-destructive">{state.fieldErrors.amount}</p>
            )}
          </div>

          <div className="flex flex-col">
            <label htmlFor="paymentMethodId" className="label-caps mb-1 text-muted-foreground">
              Paid from
            </label>
            <select
              id="paymentMethodId"
              name="paymentMethodId"
              required
              defaultValue={methods[0]?.id}
              aria-invalid={state.fieldErrors?.paymentMethodId ? true : undefined}
              className={inputClass}
            >
              {methods.map((m) => (
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

          {state.error && <p className="text-[13px] text-destructive">{state.error}</p>}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Cancel
            </button>
            <Submit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
