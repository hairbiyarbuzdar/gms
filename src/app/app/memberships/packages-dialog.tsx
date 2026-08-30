"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Tags, Undo2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import type { PackageRow } from "./data";
import { createPackage, togglePackage, updatePackage, type PackageState } from "./package-actions";

const inputClass =
  "w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-destructive";

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#570000] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

/**
 * Retire / restore. The button is a separate component so useFormStatus reads
 * this form's state - called in the parent it would report the parent's.
 */
function ToggleSubmit({ isActive, name }: { isActive: boolean; name: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title={isActive ? "Retire this package" : "Restore this package"}
      className="rounded border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
    >
      {isActive ? (
        <X className="size-3.5" aria-hidden="true" />
      ) : (
        <Undo2 className="size-3.5" aria-hidden="true" />
      )}
      <span className="sr-only">
        {isActive ? `Retire ${name}` : `Restore ${name}`}
      </span>
    </button>
  );
}

function ToggleButton({ pkg }: { pkg: PackageRow }) {
  const [, action] = useActionState<PackageState, FormData>(togglePackage, {});

  return (
    <form action={action}>
      <input type="hidden" name="id" value={pkg.id} />
      <ToggleSubmit isActive={pkg.isActive} name={pkg.name} />
    </form>
  );
}

function EditRow({ pkg, onDone }: { pkg: PackageRow; onDone: () => void }) {
  const [state, action] = useActionState<PackageState, FormData>(updatePackage, {});

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className="flex flex-col gap-2 p-3">
      <input type="hidden" name="id" value={pkg.id} />
      <div className="flex flex-wrap items-start gap-2">
        <input
          name="name"
          defaultValue={pkg.name}
          required
          aria-label="Package name"
          className={`${inputClass} min-w-0 flex-1`}
        />
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={pkg.price}
          required
          aria-label="Amount"
          className={`${inputClass} w-28`}
        />
        <input
          name="durationMonths"
          type="number"
          min="1"
          max="60"
          defaultValue={pkg.durationMonths}
          required
          aria-label="Duration in months"
          className={`${inputClass} w-20`}
        />
        <SaveButton label="Save" />
        <button
          type="button"
          onClick={onDone}
          className="shrink-0 rounded border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Cancel
        </button>
      </div>
      {(state.fieldErrors?.name || state.fieldErrors?.price || state.fieldErrors?.durationMonths) && (
        <p className="text-[13px] text-destructive">
          {state.fieldErrors.name || state.fieldErrors.price || state.fieldErrors.durationMonths}
        </p>
      )}
    </form>
  );
}

export function PackagesDialog({ packages }: { packages: PackageRow[] }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [state, action] = useActionState<PackageState, FormData>(createPackage, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <Tags className="size-4" aria-hidden="true" />
          Packages
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Packages</DialogTitle>
          <DialogDescription>
            Membership plans and their monthly amount. These appear when adding a member.
          </DialogDescription>
        </DialogHeader>

        {/* Add */}
        <form ref={formRef} action={action} className="flex flex-col gap-2" noValidate>
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="pkg-name" className="label-caps mb-1 block text-muted-foreground">
                Package name
              </label>
              <input
                id="pkg-name"
                name="name"
                required
                placeholder="Monthly"
                aria-invalid={state.fieldErrors?.name ? true : undefined}
                className={inputClass}
              />
            </div>
            <div className="w-28">
              <label htmlFor="pkg-price" className="label-caps mb-1 block text-muted-foreground">
                Amount
              </label>
              <input
                id="pkg-price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="4000"
                aria-invalid={state.fieldErrors?.price ? true : undefined}
                className={inputClass}
              />
            </div>
            <div className="w-20">
              <label htmlFor="pkg-months" className="label-caps mb-1 block text-muted-foreground">
                Months
              </label>
              <input
                id="pkg-months"
                name="durationMonths"
                type="number"
                min="1"
                max="60"
                required
                defaultValue={1}
                aria-invalid={state.fieldErrors?.durationMonths ? true : undefined}
                className={inputClass}
              />
            </div>
            <div className="self-end">
              <SaveButton label="Add" />
            </div>
          </div>

          {(state.fieldErrors?.name ||
            state.fieldErrors?.price ||
            state.fieldErrors?.durationMonths) && (
            <p className="text-[13px] text-destructive">
              {state.fieldErrors.name ||
                state.fieldErrors.price ||
                state.fieldErrors.durationMonths}
            </p>
          )}
        </form>

        {/* List */}
        <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-border">
          {packages.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              No packages yet. Add one above to start enrolling members.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {packages.map((pkg) =>
                editingId === pkg.id ? (
                  <li key={pkg.id} className="bg-secondary/40">
                    <EditRow pkg={pkg} onDone={() => setEditingId(null)} />
                  </li>
                ) : (
                  <li
                    key={pkg.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      pkg.isActive ? "" : "opacity-60"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {pkg.name}
                        {!pkg.isActive && (
                          <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Retired
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {pkg.durationMonths === 1
                          ? "1 month"
                          : `${pkg.durationMonths} months`}
                        {pkg.memberCount > 0 &&
                          ` · ${pkg.memberCount} member${pkg.memberCount === 1 ? "" : "s"}`}
                      </p>
                    </div>

                    <p className="data-mono shrink-0 text-sm font-medium">
                      {formatMoney(pkg.price)}
                    </p>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(pkg.id)}
                        title="Edit"
                        className="rounded border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        <span className="sr-only">Edit {pkg.name}</span>
                      </button>
                      <ToggleButton pkg={pkg} />
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        <p className="text-[13px] leading-[18px] text-muted-foreground">
          Retiring a package hides it when adding members. Existing memberships keep it, so
          history and reports stay intact.
        </p>
      </DialogContent>
    </Dialog>
  );
}
