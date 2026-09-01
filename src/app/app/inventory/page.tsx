import { Boxes, TriangleAlert } from "lucide-react";
import { tenantDb } from "@/lib/tenant-db";
import { formatMoneyPrecise } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import {
  AddProductDialog,
  AdjustStockDialog,
  EditProductDialog,
  serialLabel,
  ToggleProductButton,
  type ProductRow,
} from "./product-dialogs";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const { db, tenantId } = await tenantDb();

  const records = await db.product.findMany({
    where: { tenantId },
    orderBy: [{ isActive: "desc" }, { serial: "asc" }],
    select: {
      id: true,
      serial: true,
      name: true,
      category: true,
      photoUrl: true,
      costPrice: true,
      salePrice: true,
      quantity: true,
      reorderLevel: true,
      isActive: true,
    },
  });

  const products: ProductRow[] = records.map((p) => ({
    ...p,
    costPrice: p.costPrice.toString(),
    salePrice: p.salePrice.toString(),
  }));

  const lowStock = products.filter((p) => p.isActive && p.quantity <= p.reorderLevel);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Retail"
        title="Inventory"
        description="Products, stock levels, and adjustments."
        action={<AddProductDialog />}
      />

      {lowStock.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#B45309]/30 bg-[#B45309]/5 px-4 py-3 text-[13px] text-[#B45309]">
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>
            {lowStock.length} item{lowStock.length === 1 ? "" : "s"} at or below the reorder
            level: {lowStock.map((p) => p.name).join(", ")}.
          </span>
        </div>
      )}

      {products.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center">
          <Boxes className="size-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">No products yet</p>
          <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
            Add one to start selling at the front desk.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="label-caps px-4 py-3 text-right text-muted-foreground">#</th>
                <th className="label-caps px-4 py-3 text-muted-foreground">Product</th>
                <th className="label-caps px-4 py-3 text-muted-foreground">Category</th>
                <th className="label-caps px-4 py-3 text-right text-muted-foreground">Cost</th>
                <th className="label-caps px-4 py-3 text-right text-muted-foreground">Price</th>
                <th className="label-caps px-4 py-3 text-right text-muted-foreground">In stock</th>
                <th className="label-caps px-4 py-3 text-right text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const low = product.isActive && product.quantity <= product.reorderLevel;
                return (
                  <tr
                    key={product.id}
                    className={`border-b border-border last:border-0 ${
                      product.isActive ? "" : "opacity-55"
                    }`}
                  >
                    <td className="data-mono px-4 py-3 text-right text-muted-foreground">
                      {serialLabel(product.serial)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.photoUrl}
                            alt={product.name}
                            className="size-9 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="flex size-9 shrink-0 items-center justify-center rounded bg-secondary text-[11px] font-bold text-muted-foreground"
                          >
                            {serialLabel(product.serial)}
                          </span>
                        )}
                        <p className="text-sm font-medium">
                          {product.name}
                          {!product.isActive && (
                            <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                              Hidden
                            </span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {product.category ?? "—"}
                    </td>
                    <td className="data-mono px-4 py-3 text-right text-muted-foreground">
                      {formatMoneyPrecise(product.costPrice)}
                    </td>
                    <td className="data-mono px-4 py-3 text-right">
                      {formatMoneyPrecise(product.salePrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`data-mono inline-block rounded px-2 py-1 ${
                          product.quantity === 0
                            ? "bg-destructive/10 text-destructive"
                            : low
                              ? "bg-[#B45309]/10 text-[#B45309]"
                              : ""
                        }`}
                      >
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <AdjustStockDialog product={product} />
                        <EditProductDialog product={product} />
                        <ToggleProductButton product={product} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
