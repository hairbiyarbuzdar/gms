"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createMembership, type ActionState } from "./actions";
import type { PackageOption } from "./data";
import { BarcodeDialog, type BarcodeTarget } from "@/components/barcode-dialog";
import { MemberForm, type ExtraOption } from "./member-form";

export function AddMemberDialog({
  packages,
  extras,
}: {
  packages: PackageOption[];
  extras: ExtraOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(createMembership, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [justCreated, setJustCreated] = useState<BarcodeTarget | null>(null);
  // Remount the form after each successful add so its internal state resets.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      formRef.current?.reset();
      setFormKey((k) => k + 1);
      if (state.created) {
        setJustCreated({
          title: state.created.memberName,
          barcode: state.created.barcode,
          subtitle: state.created.packageName,
        });
      }
    }
  }, [state.ok, state.created]);

  const noPackages = packages.length === 0;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#570000]">
            <Plus className="size-4" aria-hidden="true" />
            New member
          </button>
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>New member</DialogTitle>
            <DialogDescription>
              Creates the member and their membership. A barcode is generated automatically.
            </DialogDescription>
          </DialogHeader>

          {noPackages ? (
            <div className="rounded border border-border bg-secondary px-3 py-3 text-[13px] leading-[18px] text-muted-foreground">
              No packages exist yet. Add a package before enrolling members.
            </div>
          ) : (
            <MemberForm
              key={formKey}
              state={state}
              action={formAction}
              formRef={formRef}
              packages={packages}
              extras={extras}
              onCancel={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <BarcodeDialog
        target={justCreated}
        open={justCreated !== null}
        onOpenChange={(next) => !next && setJustCreated(null)}
        heading="Member added"
        description="Print the barcode now, or find it later from the member's row."
      />
    </>
  );
}
