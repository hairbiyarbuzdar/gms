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
import { formatMoney } from "@/lib/format";
import { PhotoCapture } from "@/components/photo-capture";
import { createMembership, type ActionState } from "./actions";
import type { PackageOption } from "./data";
import { BarcodeDialog, type BarcodeTarget } from "@/components/barcode-dialog";

const inputClass =
  "w-full rounded border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-destructive";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#570000] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Adding…" : "Add member"}
    </button>
  );
}

/** 3600212345678 -> 36002-1234567-8 for display; input stores digits only. */
function formatCnic(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export function AddMemberDialog({ packages }: { packages: PackageOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(createMembership, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [justCreated, setJustCreated] = useState<BarcodeTarget | null>(null);

  // Controlled so we can strip/format the CNIC and carry the photo data URL.
  const [cnic, setCnic] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      formRef.current?.reset();
      setCnic("");
      setPhoto(null);
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
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setCnic("");
            setPhoto(null);
          }
        }}
      >
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

              {/* Photo comes first - hand it over via a hidden field on submit. */}
              <input type="hidden" name="photo" value={photo ?? ""} />
              <PhotoCapture value={photo} onChange={setPhoto} />

              <div className="flex flex-col">
                <label htmlFor="name" className="label-caps mb-1 text-muted-foreground">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  autoFocus
                  placeholder="Ahsan Raza"
                  aria-invalid={state.fieldErrors?.name ? true : undefined}
                  className={inputClass}
                />
                {state.fieldErrors?.name && (
                  <p className="mt-1 text-[13px] text-destructive">{state.fieldErrors.name}</p>
                )}
              </div>

              <div className="flex flex-col">
                <label htmlFor="cnic" className="label-caps mb-1 text-muted-foreground">
                  CNIC{" "}
                  <span className="font-normal normal-case tracking-normal">(optional)</span>
                </label>
                {/* Shows dashes for readability; the hidden field below submits
                    digits only, so this one deliberately has no `name`. */}
                <input
                  id="cnic"
                  inputMode="numeric"
                  value={formatCnic(cnic)}
                  onChange={(e) => setCnic(e.target.value.replace(/\D/g, "").slice(0, 13))}
                  placeholder="36002-1234567-8"
                  aria-invalid={state.fieldErrors?.cnic ? true : undefined}
                  className={inputClass}
                />
                <input type="hidden" name="cnic" value={cnic} />
                {state.fieldErrors?.cnic && (
                  <p className="mt-1 text-[13px] text-destructive">{state.fieldErrors.cnic}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label htmlFor="phone" className="label-caps mb-1 text-muted-foreground">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    required
                    inputMode="numeric"
                    maxLength={11}
                    pattern="\d{11}"
                    placeholder="03001234567"
                    aria-invalid={state.fieldErrors?.phone ? true : undefined}
                    className={inputClass}
                  />
                  {state.fieldErrors?.phone && (
                    <p className="mt-1 text-[13px] text-destructive">{state.fieldErrors.phone}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label htmlFor="joinDate" className="label-caps mb-1 text-muted-foreground">
                    Joined
                  </label>
                  <input
                    id="joinDate"
                    name="joinDate"
                    type="date"
                    defaultValue={today}
                    max={today}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label htmlFor="email" className="label-caps mb-1 text-muted-foreground">
                  Email{" "}
                  <span className="font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ahsan@example.com"
                  aria-invalid={state.fieldErrors?.email ? true : undefined}
                  className={inputClass}
                />
                {state.fieldErrors?.email && (
                  <p className="mt-1 text-[13px] text-destructive">{state.fieldErrors.email}</p>
                )}
              </div>

              <div className="flex flex-col">
                <label htmlFor="packageId" className="label-caps mb-1 text-muted-foreground">
                  Package
                </label>
                <select
                  id="packageId"
                  name="packageId"
                  required
                  defaultValue={packages[0]?.id}
                  aria-invalid={state.fieldErrors?.packageId ? true : undefined}
                  className={inputClass}
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatMoney(p.price)}
                    </option>
                  ))}
                </select>
                {state.fieldErrors?.packageId && (
                  <p className="mt-1 text-[13px] text-destructive">
                    {state.fieldErrors.packageId}
                  </p>
                )}
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
