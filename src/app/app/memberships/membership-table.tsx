"use client";

import { useState } from "react";
import { Barcode, Pencil } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import type { MembershipRow, PackageOption } from "./data";
import { StatusPill } from "./status-pill";
import { RenewDialog } from "./renew-dialog";
import { EditMemberDialog } from "./edit-member-dialog";
import { MemberDetailsDialog } from "./member-details-dialog";
import { PhotoViewer } from "./photo-viewer";
import { BarcodeDialog, type BarcodeTarget } from "@/components/barcode-dialog";
import type { ExtraOption, MemberInitial } from "./member-form";

type PaymentMethod = { id: string; name: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatCnic(digits: string | null): string | null {
  if (!digits) return null;
  return digits.length === 13
    ? `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
    : digits;
}

/** Turns a row into the shape the edit form seeds from. */
function toInitial(row: MembershipRow): MemberInitial {
  return {
    membershipId: row.id,
    name: row.memberName,
    phone: row.memberPhone,
    cnic: row.memberCnic,
    email: row.memberEmail,
    joinDate: row.joinDate.toISOString().slice(0, 10),
    packageId: row.packageId,
    photoUrl: row.memberPhotoUrl,
    extraIds: row.extraIds,
  };
}

export function MembershipTable({
  rows,
  paymentMethods,
  packages,
  extras,
}: {
  rows: MembershipRow[];
  paymentMethods: PaymentMethod[];
  /** Every active package plus, for editing, whatever a member is currently on. */
  packages: PackageOption[];
  extras: ExtraOption[];
}) {
  const [renewing, setRenewing] = useState<MembershipRow | null>(null);
  const [editing, setEditing] = useState<MembershipRow | null>(null);
  const [viewing, setViewing] = useState<MembershipRow | null>(null);
  const [showingBarcode, setShowingBarcode] = useState<BarcodeTarget | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; name: string } | null>(null);
  const canRenew = paymentMethods.length > 0;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-primary-tint">
              <th className="label-caps px-4 py-3 text-muted-foreground">Member</th>
              <th className="label-caps px-4 py-3 text-muted-foreground">Package</th>
              <th className="label-caps px-4 py-3 text-muted-foreground">Joined</th>
              <th className="label-caps px-4 py-3 text-muted-foreground">Next renewal</th>
              <th className="label-caps px-4 py-3 text-muted-foreground">Status</th>
              <th className="label-caps px-4 py-3 text-right text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {row.memberPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setViewingPhoto({ url: row.memberPhotoUrl!, name: row.memberName })
                        }
                        className="shrink-0 rounded ring-offset-2 transition hover:ring-2 hover:ring-primary"
                        title="View photo"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.memberPhotoUrl}
                          alt={row.memberName}
                          className="size-9 rounded object-cover"
                        />
                      </button>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded bg-secondary text-[11px] font-bold text-muted-foreground"
                      >
                        {initials(row.memberName)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setViewing(row)}
                        className="block max-w-full truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
                      >
                        {row.memberName}
                      </button>
                      <p className="data-mono truncate text-[12px] text-muted-foreground">
                        {row.memberBarcode}
                      </p>
                      {row.memberCnic && (
                        <p className="data-mono truncate text-[11px] text-muted-foreground">
                          {formatCnic(row.memberCnic)}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm">{row.packageName}</p>
                  <p className="data-mono text-[12px] text-muted-foreground">
                    {formatMoney(row.packagePrice)}
                  </p>
                  {row.extras.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      + {row.extras.map((x) => x.name).join(", ")} (
                      {formatMoney(row.extrasTotal)})
                    </p>
                  )}
                </td>
                <td className="data-mono px-4 py-3 text-muted-foreground">
                  {formatDate(row.joinDate)}
                </td>
                <td className="data-mono px-4 py-3">{formatDate(row.nextRenewalDate)}</td>
                <td className="px-4 py-3">
                  <StatusPill row={row} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setShowingBarcode({
                          title: row.memberName,
                          barcode: row.memberBarcode,
                          subtitle: row.packageName,
                        })
                      }
                      title="Show barcode"
                      className="rounded border border-border p-1.5 text-primary transition-colors hover:border-primary hover:bg-primary-tint"
                    >
                      <Barcode className="size-4" aria-hidden="true" />
                      <span className="sr-only">Barcode for {row.memberName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(row)}
                      title="Edit member"
                      className="rounded border border-border p-1.5 text-primary transition-colors hover:border-primary hover:bg-primary-tint"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      <span className="sr-only">Edit {row.memberName}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenewing(row)}
                      disabled={!canRenew}
                      title={canRenew ? undefined : "Add a payment method first"}
                      className="rounded bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Renew
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BarcodeDialog
        target={showingBarcode}
        open={showingBarcode !== null}
        onOpenChange={(next) => !next && setShowingBarcode(null)}
        heading="Membership barcode"
        description="Scan this code to look the member up at renewal time."
      />

      <PhotoViewer
        photo={viewingPhoto}
        onClose={() => setViewingPhoto(null)}
      />

      {renewing && (
        <RenewDialog
          key={renewing.id}
          membershipId={renewing.id}
          memberName={renewing.memberName}
          packageFee={renewing.packagePrice}
          extras={renewing.extras}
          paymentMethods={paymentMethods}
          open={true}
          onOpenChange={(open) => !open && setRenewing(null)}
        />
      )}

      {editing && (
        <EditMemberDialog
          key={editing.id}
          packages={packages}
          extras={extras}
          initial={toInitial(editing)}
          open={true}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}

      {viewing && (
        <MemberDetailsDialog
          key={viewing.id}
          row={viewing}
          open={true}
          onOpenChange={(open) => !open && setViewing(null)}
        />
      )}
    </>
  );
}
