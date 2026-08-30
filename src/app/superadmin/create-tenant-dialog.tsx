"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTenant, type CreateTenantState } from "./actions";

const inputClass =
  "w-full rounded border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-destructive";

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
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[13px] leading-[18px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#570000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Creating…" : "Create tenant"}
    </button>
  );
}

export function CreateTenantDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<CreateTenantState, FormData>(createTenant, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Close and reset once the server confirms the tenant was created.
  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#570000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Plus className="size-4" aria-hidden="true" />
          New tenant
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>New tenant</DialogTitle>
          <DialogDescription>
            Provisions an empty management system and its single login account.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="flex flex-col gap-4" noValidate>
          {state.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[13px] leading-[18px] text-destructive"
            >
              <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
              <span>{state.error}</span>
            </div>
          )}

          <Field
            id="name"
            label="Gym name"
            placeholder="Iron Reserve Gulberg"
            required
            autoFocus
            error={state.fieldErrors?.name}
          />
          <Field
            id="location"
            label="Location"
            placeholder="Gulberg III, Lahore"
            required
            error={state.fieldErrors?.location}
          />

          <div className="border-t border-border pt-4">
            <p className="label-caps mb-3 text-muted-foreground">Login details</p>
            <div className="flex flex-col gap-4">
              <Field
                id="email"
                label="Email"
                type="email"
                autoComplete="off"
                placeholder="manager@example.com"
                required
                error={state.fieldErrors?.email}
              />
              <Field
                id="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
                error={state.fieldErrors?.password}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
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
