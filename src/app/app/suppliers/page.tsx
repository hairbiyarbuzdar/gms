import { Truck } from "lucide-react";
import { getTenantContext } from "@/lib/tenant-context";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { getPurchaseFormData, getPurchases, getSuppliers } from "./data";
import { AddSupplierDialog, EditSupplierDialog } from "./supplier-dialogs";
import { PurchaseDialog } from "./purchase-dialog";
import { PayInvoiceDialog } from "./pay-invoice-dialog";

export const metadata = { title: "Suppliers" };

const STATUS_STYLES = {
  UNPAID: "bg-destructive/10 text-destructive",
  PARTIAL: "bg-[#B45309]/10 text-[#B45309]",
  PAID: "bg-[#2D5A27]/10 text-[#2D5A27]",
} as const;

export default async function SuppliersPage() {
  await getTenantContext();

  const [suppliers, purchases, formData] = await Promise.all([
    getSuppliers(),
    getPurchases(),
    getPurchaseFormData(),
  ]);

  const totalOutstanding = purchases.reduce((sum, p) => sum + p.outstanding, 0);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Purchasing"
        title="Suppliers"
        description="Suppliers and the purchase invoices for stock you buy from them."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AddSupplierDialog />
            <PurchaseDialog
              suppliers={formData.suppliers}
              products={formData.products}
              methods={formData.methods}
            />
          </div>
        }
      />

      {/* Suppliers */}
      <section className="mt-8" aria-label="Suppliers">
        <div className="mb-3 flex items-center gap-3">
          <Truck className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="label-caps text-muted-foreground">Suppliers</h2>
          <div className="h-px flex-1 bg-border" />
          <span className="data-mono text-[13px] text-muted-foreground">{suppliers.length}</span>
        </div>

        {suppliers.length === 0 ? (
          <p className="rounded-lg border border-border bg-card px-4 py-10 text-center text-[13px] text-muted-foreground">
            No suppliers yet. Add one to start recording purchases.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="label-caps px-4 py-3 text-muted-foreground">Name</th>
                  <th className="label-caps px-4 py-3 text-muted-foreground">Phone</th>
                  <th className="label-caps px-4 py-3 text-muted-foreground">Email</th>
                  <th className="label-caps px-4 py-3 text-right text-muted-foreground">Invoices</th>
                  <th className="label-caps px-4 py-3 text-right text-muted-foreground">
                    Outstanding
                  </th>
                  <th className="label-caps px-4 py-3 text-right text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.email ?? "—"}</td>
                    <td className="data-mono px-4 py-3 text-right text-muted-foreground">
                      {s.invoiceCount}
                    </td>
                    <td
                      className={`data-mono px-4 py-3 text-right ${
                        s.outstanding > 0 ? "font-medium text-[#B45309]" : "text-muted-foreground"
                      }`}
                    >
                      {formatMoney(s.outstanding)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <EditSupplierDialog supplier={s} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Purchase invoices */}
      <section className="mt-8" aria-label="Purchase invoices">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="label-caps text-muted-foreground">Purchase invoices</h2>
          <div className="h-px flex-1 bg-border" />
          <span className="text-[13px] text-muted-foreground">
            Outstanding:{" "}
            <span className="data-mono text-foreground">{formatMoney(totalOutstanding)}</span>
          </span>
        </div>

        {purchases.length === 0 ? (
          <p className="rounded-lg border border-border bg-card px-4 py-10 text-center text-[13px] text-muted-foreground">
            No purchase invoices yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="label-caps px-4 py-3 text-muted-foreground">Date</th>
                  <th className="label-caps px-4 py-3 text-muted-foreground">Supplier</th>
                  <th className="label-caps px-4 py-3 text-muted-foreground">Ref</th>
                  <th className="label-caps px-4 py-3 text-right text-muted-foreground">Items</th>
                  <th className="label-caps px-4 py-3 text-right text-muted-foreground">Total</th>
                  <th className="label-caps px-4 py-3 text-right text-muted-foreground">Paid</th>
                  <th className="label-caps px-4 py-3 text-muted-foreground">Status</th>
                  <th className="label-caps px-4 py-3 text-right text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="data-mono px-4 py-3 text-muted-foreground">
                      {formatDate(p.invoiceDate)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{p.supplierName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.reference ?? "—"}</td>
                    <td className="data-mono px-4 py-3 text-right text-muted-foreground">
                      {p.lineCount}
                    </td>
                    <td className="data-mono px-4 py-3 text-right">{formatMoney(p.total)}</td>
                    <td className="data-mono px-4 py-3 text-right text-muted-foreground">
                      {formatMoney(p.paid)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {p.outstanding > 0 && formData.methods.length > 0 && (
                          <PayInvoiceDialog
                            invoiceId={p.id}
                            supplierName={p.supplierName}
                            outstanding={p.outstanding}
                            methods={formData.methods}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
