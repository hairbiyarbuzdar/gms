"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Package, Pencil, Undo2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import type { ExtraRow } from "./data";
import { createExtra, toggleExtra, updateExtra, type ExtraState } from "./extra-actions";

const inputClass =
  "w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-destructive";

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function firstError(state: ExtraState) {
  return state.fieldErrors?.name || state.fieldErrors?.fee;
}

function ToggleSubmit({ isActive, name }: { isActive: boolean; name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title={isActive ? "Retire this extra" : "Restore this extra"}
      className="rounded border border-border p-1.5 text-primary transition-colors hover:border-primary hover:bg-primary-tint disabled:opacity-50"
    >
      {isActive ? (
        <X className="size-3.5" aria-hidden="true" />
      ) : (
        <Undo2 className="size-3.5" aria-hidden="true" />
      )}
      <span className="sr-only">{isActive ? `Retire ${name}` : `Restore ${name}`}</span>
    </button>
  );
}

function ToggleButton({ extra }: { extra: ExtraRow }) {
  const [, action] = useActionState<ExtraState, FormData>(toggleExtra, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={extra.id} />
      <ToggleSubmit isActive={extra.isActive} name={extra.name} />
    </form>
  );
}

function EditRow({ extra, onDone }: { extra: ExtraRow; onDone: () => void }) {
  const [state, action] = useActionState<ExtraState, FormData>(updateExtra, {});

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className="flex flex-wrap items-start gap-2 p-3">
      <input type="hidden" name="id" value={extra.id} />
      <input
        name="name"
        defaultValue={extra.name}
        required
        aria-label="Extra name"
        className={`${inputClass} min-w-0 flex-1`}
      />
      <input
        name="fee"
        type="number"
        step="0.01"
        min="0"
        defaultValue={extra.fee}
        required
        aria-label="Fee"
        className={`${inputClass} w-28`}
      />
      <SaveButton label="Save" />
      <button
        type="button"
        onClick={onDone}
        className="shrink-0 rounded border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        Cancel
      </button>
      {firstError(state) && (
        <p className="w-full text-[13px] text-destructive">{firstError(state)}</p>
      )}
    </form>
  );
}

export function ExtrasDialog({ extras }: { extras: ExtraRow[] }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [state, action] = useActionState<ExtraState, FormData>(createExtra, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded border border-primary bg-card px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
          <Package className="size-4" aria-hidden="true" />
          Extras
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Extras</DialogTitle>
          <DialogDescription>
            Paid add-ons a member can take on top of their package — locker, towel service,
            personal training. Charged monthly with the renewal.
          </DialogDescription>
        </DialogHeader>

        {/* Add */}
        <form ref={formRef} action={action} className="flex flex-col gap-2" noValidate>
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="extra-name" className="label-caps mb-1 block text-muted-foreground">
                Extra name
              </label>
              <input
                id="extra-name"
                name="name"
                required
                placeholder="Locker"
                aria-invalid={state.fieldErrors?.name ? true : undefined}
                className={inputClass}
              />
            </div>
            <div className="w-32">
              <label htmlFor="extra-fee" className="label-caps mb-1 block text-muted-foreground">
                Fee (PKR)
              </label>
              <input
                id="extra-fee"
                name="fee"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="500"
                aria-invalid={state.fieldErrors?.fee ? true : undefined}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SaveButton label="Add extra" />
            {firstError(state) && (
              <p className="text-[13px] text-destructive">{firstError(state)}</p>
            )}
          </div>
        </form>

        {/* List */}
        <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-border">
          {extras.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              No extras yet. Add one above.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {extras.map((extra) =>
                editingId === extra.id ? (
                  <li key={extra.id} className="bg-secondary/40">
                    <EditRow extra={extra} onDone={() => setEditingId(null)} />
                  </li>
                ) : (
                  <li
                    key={extra.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      extra.isActive ? "" : "opacity-60"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {extra.name}
                        {!extra.isActive && (
                          <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Retired
                          </span>
                        )}
                      </p>
                      {extra.memberCount > 0 && (
                        <p className="text-[12px] text-muted-foreground">
                          {extra.memberCount} member{extra.memberCount === 1 ? "" : "s"}
                        </p>
                      )}
                    </div>
                    <p className="data-mono shrink-0 text-sm font-medium">
                      {formatMoney(extra.fee)}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(extra.id)}
                        title="Edit"
                        className="rounded border border-border p-1.5 text-primary transition-colors hover:border-primary hover:bg-primary-tint"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        <span className="sr-only">Edit {extra.name}</span>
                      </button>
                      <ToggleButton extra={extra} />
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        <p className="text-[13px] leading-[18px] text-muted-foreground">
          A retired extra stays on the members who already have it — their fee is locked in
          from when it was added.
        </p>
      </DialogContent>
    </Dialog>
  );
}
