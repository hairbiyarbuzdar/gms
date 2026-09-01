"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import { setMembershipExtras, type ExtraState } from "./extra-actions";

type AvailableExtra = { id: string; name: string; fee: string };
type CurrentExtra = { id: string; name: string; fee: string };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#570000] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving…" : "Save extras"}
    </button>
  );
}

export function ManageMemberExtrasDialog({
  membershipId,
  memberName,
  available,
  /** The extra names this membership currently carries (matched by name so a
      fee snapshot doesn't confuse the checkbox state). */
  currentExtraNames,
  open,
  onOpenChange,
}: {
  membershipId: string;
  memberName: string;
  available: AvailableExtra[];
  currentExtraNames: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, action] = useActionState<ExtraState, FormData>(setMembershipExtras, {});

  useEffect(() => {
    if (state.ok) onOpenChange(false);
  }, [state.ok, onOpenChange]);

  const currentSet = new Set(currentExtraNames);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Manage extras</DialogTitle>
          <DialogDescription>{memberName}</DialogDescription>
        </DialogHeader>

        {available.length === 0 ? (
          <p className="rounded border border-border bg-secondary px-3 py-3 text-[13px] text-muted-foreground">
            No extras exist yet. Add some with the Extras button first.
          </p>
        ) : (
          <form action={action} className="flex flex-col gap-4" noValidate>
            <input type="hidden" name="membershipId" value={membershipId} />

            <fieldset className="flex flex-col divide-y divide-border rounded-lg border border-border">
              <legend className="sr-only">Extras for {memberName}</legend>
              {available.map((extra) => (
                <label
                  key={extra.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm"
                >
                  <input
                    type="checkbox"
                    name="extraIds"
                    value={extra.id}
                    defaultChecked={currentSet.has(extra.name)}
                    className="size-4 shrink-0 rounded border-input accent-primary"
                  />
                  <span className="min-w-0 flex-1 truncate">{extra.name}</span>
                  <span className="data-mono shrink-0 text-muted-foreground">
                    {formatMoney(extra.fee)}
                  </span>
                </label>
              ))}
            </fieldset>

            {state.error && <p className="text-[13px] text-destructive">{state.error}</p>}

            <p className="text-[12px] text-muted-foreground">
              Ticked extras are added to this member&rsquo;s monthly renewal amount.
            </p>

            <DialogFooter>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
              <SaveButton />
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
