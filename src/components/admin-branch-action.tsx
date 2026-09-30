"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2, Plus, Receipt, BadgeDollarSign, ScanLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type BranchOption = { id: string; name: string; status: string };
export function AdminBranchAction({
  branches,
  module,
  label,
  secondary = false,
}: {
  branches: BranchOption[];
  module: string;
  label: string;
  secondary?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const active = branches.filter((b) => b.status === "ACTIVE");
  const Icon = label === "Scan barcode" ? ScanLine : module === "invoices" ? Receipt : module === "expenses" ? BadgeDollarSign : Plus;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`focus-visible:outline-primary flex items-center gap-2 rounded font-medium transition-colors focus-visible:outline-2 ${secondary ? "border-primary bg-card text-primary hover:bg-primary hover:text-primary-foreground border px-3 py-2 text-[13px]" : "bg-primary text-primary-foreground hover:bg-primary-hover px-4 py-2.5 text-sm"}`}
      >
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              Select a branch to continue in its {module.replaceAll("-", " ")} screen.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50svh] space-y-2 overflow-y-auto">
            {active.map((branch) => (
              <Link
                key={branch.id}
                href={`/admin/branches/${branch.id}/${module}`}
                className="border-border hover:border-primary hover:bg-primary/5 focus-visible:outline-primary flex items-center gap-3 rounded border px-4 py-3 text-sm transition-colors focus-visible:outline-2"
              >
                <Building2 className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 font-medium break-words">{branch.name}</span>
                <ArrowRight className="text-primary size-4 shrink-0" aria-hidden="true" />
              </Link>
            ))}
            {!active.length && (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No active branches are available.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
