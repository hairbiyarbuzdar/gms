import Link from "next/link";
import { tenantDb } from "@/lib/tenant-db";
import { PageHeader } from "@/components/page-header";
import { PosTerminal } from "./pos-terminal";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const { db, tenantId } = await tenantDb();

  const [products, members, paymentMethods, recent] = await Promise.all([
    db.product.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, sku: true, category: true, salePrice: true, quantity: true },
    }),
    db.member.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, barcode: true },
    }),
    db.paymentMethod.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.retailInvoice.findFirst({
      where: { tenantId },
      orderBy: { soldAt: "desc" },
      select: { number: true },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Retail"
        title="New sale"
        description={
          recent ? `Last invoice ${recent.number}` : "No sales recorded yet."
        }
      />

      {paymentMethods.length === 0 && (
        <p className="mt-4 rounded border border-border bg-card px-4 py-3 text-[13px] text-muted-foreground">
          Sales need a payment method.{" "}
          <Link href="/app/payment-methods" className="text-primary hover:underline">
            Add one
          </Link>{" "}
          to start recording.
        </p>
      )}

      <PosTerminal
        products={products.map((p) => ({ ...p, salePrice: p.salePrice.toString() }))}
        members={members}
        paymentMethods={paymentMethods}
      />
    </main>
  );
}
