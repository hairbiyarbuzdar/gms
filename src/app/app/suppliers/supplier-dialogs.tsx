"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createSupplier, updateSupplier, type SupplierState } from "./actions";
import type { SupplierRow } from "./data";

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
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
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
      {error && <p className="mt-1 text-[13px] text-destructive">{error}</p>}
    </div>
  );
}

function SupplierForm({
  state,
  action,
  formRef,
  supplier,
  onCancel,
  submitLabel,
}: {
  state: SupplierState;
  action: (formData: FormData) => void;
  formRef: React.RefObject<HTMLFormElement | null>;
  supplier?: SupplierRow;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4" noValidate>
      {supplier && <input type="hidden" name="id" value={supplier.id} />}

      {state.error && <p className="text-[13px] text-destructive">{state.error}</p>}

      <Field
        id="name"
        label="Name"
        required
        autoFocus
        defaultValue={supplier?.name}
        placeholder="Nutrition Depot"
        error={state.fieldErrors?.name}
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          id="phone"
          label="Phone"
          inputMode="numeric"
          maxLength={11}
          pattern="\d{11}"
          defaultValue={supplier?.phone ?? ""}
          placeholder="03001234567"
          error={state.fieldErrors?.phone}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          defaultValue={supplier?.email ?? ""}
          placeholder="sales@example.com"
          error={state.fieldErrors?.email}
        />
      </div>

      <Field
        id="address"
        label="Address"
        defaultValue={supplier?.address ?? ""}
        error={state.fieldErrors?.address}
      />

      <div className="flex flex-col">
        <label htmlFor="notes" className="label-caps mb-1 text-muted-foreground">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={supplier?.notes ?? ""}
          className={inputClass}
        />
      </div>

      <DialogFooter className="mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Cancel
        </button>
        <Submit label={submitLabel} />
      </DialogFooter>
    </form>
  );
}

export function AddSupplierDialog() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<SupplierState, FormData>(createSupplier, {});
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
          New supplier
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New supplier</DialogTitle>
          <DialogDescription>Who you buy retail stock from.</DialogDescription>
        </DialogHeader>
        <SupplierForm
          state={state}
          action={action}
          formRef={formRef}
          onCancel={() => setOpen(false)}
          submitLabel="Add supplier"
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditSupplierDialog({ supplier }: { supplier: SupplierRow }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<SupplierState, FormData>(updateSupplier, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Edit"
          className="rounded border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          <span className="sr-only">Edit {supplier.name}</span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit supplier</DialogTitle>
          <DialogDescription>{supplier.name}</DialogDescription>
        </DialogHeader>
        <SupplierForm
          state={state}
          action={action}
          formRef={formRef}
          supplier={supplier}
          onCancel={() => setOpen(false)}
          submitLabel="Save"
        />
      </DialogContent>
    </Dialog>
  );
}
