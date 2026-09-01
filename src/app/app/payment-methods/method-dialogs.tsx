"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeftRight, Archive, Pencil, Plus, TriangleAlert, Undo2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { MethodBalance } from "./data";
import {
  createPaymentMethod,
  createTransfer,
  togglePaymentMethod,
  updatePaymentMethod,
  type MethodState,
} from "./actions";

const inputClass =
  "w-full rounded border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-destructive";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="label-caps mb-1 text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        className={inputClass}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-[13px] text-destructive">{error}</p>}
    </div>
  );
}

export function AddMethodDialog() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<MethodState, FormData>(createPaymentMethod, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
          <Plus className="size-4" aria-hidden="true" />
          Add method
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Add method</DialogTitle>
          <DialogDescription>
            A cash drawer, wallet, or bank account money passes through.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="flex flex-col gap-4" noValidate>
          <Field
            id="name"
            label="Method name"
            required
            autoFocus
            placeholder="Meezan Bank"
            error={state.fieldErrors?.name}
          />
          <Field
            id="openingBalance"
            label="Opening balance (PKR)"
            type="number"
            step="0.01"
            defaultValue={0}
            hint="What the channel holds today. Later movements build on it."
            error={state.fieldErrors?.openingBalance}
          />

          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Cancel
            </button>
            <Submit label="Add method" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditMethodDialog({ method }: { method: MethodBalance }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<MethodState, FormData>(updatePaymentMethod, {});

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Edit"
          className="rounded border border-border p-1.5 text-primary transition-colors hover:border-primary hover:bg-primary-tint"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          <span className="sr-only">Edit {method.name}</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Edit method</DialogTitle>
          <DialogDescription>
            Changing the opening balance shifts the current balance by the same amount.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="id" value={method.id} />
          <Field
            id="name"
            label="Method name"
            required
            defaultValue={method.name}
            error={state.fieldErrors?.name}
          />
          <Field
            id="openingBalance"
            label="Opening balance (PKR)"
            type="number"
            step="0.01"
            defaultValue={method.openingBalance}
            error={state.fieldErrors?.openingBalance}
          />

          {state.error && <p className="text-[13px] text-destructive">{state.error}</p>}

          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Cancel
            </button>
            <Submit label="Save" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToggleSubmit({ isActive, name }: { isActive: boolean; name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title={isActive ? "Archive this method" : "Restore this method"}
      className="rounded border border-border p-1.5 text-primary transition-colors hover:border-primary hover:bg-primary-tint disabled:opacity-50"
    >
      {isActive ? (
        <Archive className="size-3.5" aria-hidden="true" />
      ) : (
        <Undo2 className="size-3.5" aria-hidden="true" />
      )}
      <span className="sr-only">
        {isActive ? "Archive " + name : "Restore " + name}
      </span>
    </button>
  );
}

export function ToggleMethodButton({ method }: { method: MethodBalance }) {
  const [, action] = useActionState<MethodState, FormData>(togglePaymentMethod, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={method.id} />
      <ToggleSubmit isActive={method.isActive} name={method.name} />
    </form>
  );
}

export function TransferDialog({
  methods,
  fromId,
  compact = false,
}: {
  methods: MethodBalance[];
  fromId?: string;
  /** Icon-only trigger, for the button on each method card. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<MethodState, FormData>(createTransfer, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state.ok]);

  const active = methods.filter((m) => m.isActive);
  const enough = active.length >= 2;
  const defaultFrom = fromId ?? active[0]?.id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <button
            title="Transfer from here"
            className="rounded border border-border p-1.5 text-primary transition-colors hover:border-primary hover:bg-primary-tint"
          >
            <ArrowLeftRight className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Transfer</span>
          </button>
        ) : (
          <button className="flex items-center gap-2 rounded border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
            <ArrowLeftRight className="size-4" aria-hidden="true" />
            Transfer
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Transfer between methods</DialogTitle>
          <DialogDescription>
            Moves money you already hold. Not income or an expense, so revenue and expense
            reports are unaffected.
          </DialogDescription>
        </DialogHeader>

        {!enough ? (
          <p className="rounded border border-border bg-secondary px-3 py-3 text-[13px] text-muted-foreground">
            You need at least two active methods to transfer between.
          </p>
        ) : (
          <form ref={formRef} action={action} className="flex flex-col gap-4" noValidate>
            {state.error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[13px] text-destructive"
              >
                <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
                <span>{state.error}</span>
              </div>
            )}

            <div className="flex flex-col">
              <label htmlFor="fromMethodId" className="label-caps mb-1 text-muted-foreground">
                From
              </label>
              <select
                id="fromMethodId"
                name="fromMethodId"
                required
                defaultValue={defaultFrom}
                className={inputClass}
              >
                {active.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.fromMethodId && (
                <p className="mt-1 text-[13px] text-destructive">
                  {state.fieldErrors.fromMethodId}
                </p>
              )}
            </div>

            <div className="flex flex-col">
              <label htmlFor="toMethodId" className="label-caps mb-1 text-muted-foreground">
                To
              </label>
              <select
                id="toMethodId"
                name="toMethodId"
                required
                defaultValue={active.find((m) => m.id !== defaultFrom)?.id}
                className={inputClass}
              >
                {active.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.toMethodId && (
                <p className="mt-1 text-[13px] text-destructive">{state.fieldErrors.toMethodId}</p>
              )}
            </div>

            <Field
              id="amount"
              label="Amount (PKR)"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="10000"
              error={state.fieldErrors?.amount}
            />
            <Field id="note" label="Note (optional)" placeholder="Cash deposited at branch" />

            <DialogFooter className="mt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
              <Submit label="Record transfer" />
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
