"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Check,
  Minus,
  Package,
  Plus,
  ScanLine,
  Search,
  TriangleAlert,
  UserPlus,
  X,
} from "lucide-react";
import { formatMoney, formatMoneyPrecise } from "@/lib/format";
import { createSale } from "./actions";

export type CatalogProduct = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  salePrice: string;
  quantity: number;
};

export type MemberOption = { id: string; name: string; barcode: string };
type PaymentMethod = { id: string; name: string };

type CartLine = { productId: string; quantity: number };

const ALL = "All items";

export function PosTerminal({
  products,
  members,
  paymentMethods,
}: {
  products: CatalogProduct[];
  members: MemberOption[];
  paymentMethods: PaymentMethod[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [discount, setDiscount] = useState("");
  const [methodId, setMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean) as string[]);
    return [ALL, ...[...set].sort()];
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== ALL && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, query, category]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const lines = cart.map((line) => {
    const product = byId.get(line.productId)!;
    const unit = Number(product.salePrice);
    return { ...line, product, unit, lineTotal: unit * line.quantity };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);

  const member = memberId ? members.find((m) => m.id === memberId) ?? null : null;

  const memberMatches = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter(
        (m) => m.name.toLowerCase().includes(q) || m.barcode.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [members, memberQuery]);

  function addToCart(product: CatalogProduct) {
    setError(null);
    setDone(null);
    setCart((current) => {
      const existing = current.find((l) => l.productId === product.id);
      const inCart = existing?.quantity ?? 0;
      if (inCart >= product.quantity) return current;
      return existing
        ? current.map((l) =>
            l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l
          )
        : [...current, { productId: product.id, quantity: 1 }];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    const product = byId.get(productId);
    if (!product) return;
    const capped = Math.min(Math.max(0, quantity), product.quantity);
    setCart((current) =>
      capped === 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) => (l.productId === productId ? { ...l, quantity: capped } : l))
    );
  }

  /** Scanning an exact SKU adds it straight to the cart. */
  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const exact = products.find((p) => p.sku?.toLowerCase() === q);
    const target = exact ?? (visible.length === 1 ? visible[0] : null);
    if (target && target.quantity > 0) {
      addToCart(target);
      setQuery("");
    }
  }

  function finalize() {
    setError(null);
    setDone(null);

    if (cart.length === 0) return setError("Add at least one item.");
    if (!methodId) return setError("Select a payment method.");
    if (discountValue > subtotal) return setError("Discount cannot exceed the subtotal.");

    startTransition(async () => {
      const result = await createSale({
        lines: cart,
        discount: discountValue,
        paymentMethodId: methodId,
        memberId: memberId ?? undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setCart([]);
      setDiscount("");
      setMemberId(null);
      setMemberQuery("");
      setDone(result.invoiceNumber ?? null);
    });
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
      {/* Catalogue */}
      <section className="rounded-lg border border-border bg-card" aria-label="Product catalog">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <h2 className="text-lg font-semibold tracking-tight">Product catalog</h2>
          <div className="relative w-full sm:w-72">
            <ScanLine
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Scan barcode or search…"
              aria-label="Scan barcode or search products"
              className="w-full rounded border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {categories.length > 1 && (
          <div className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  category === c
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="p-4">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="size-8 text-muted-foreground/50" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">
                {products.length === 0 ? "No products yet" : "Nothing matches"}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {products.length === 0
                  ? "Add products in Inventory before making a sale."
                  : "Try a different search or category."}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => {
                const inCart = cart.find((l) => l.productId === product.id)?.quantity ?? 0;
                const out = product.quantity === 0;
                const maxed = inCart >= product.quantity;
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={out || maxed}
                      className={`flex h-full w-full flex-col rounded-lg border p-3 text-left transition-colors ${
                        inCart > 0 ? "border-primary bg-primary/5" : "border-border"
                      } ${out || maxed ? "cursor-not-allowed opacity-50" : "hover:border-primary"}`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            out
                              ? "bg-destructive/10 text-destructive"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {out ? "Out of stock" : `${product.quantity} in stock`}
                        </span>
                        {inCart > 0 && (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                            {inCart}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-snug">{product.name}</p>
                      {product.sku && (
                        <p className="data-mono mt-0.5 text-[11px] text-muted-foreground">
                          {product.sku}
                        </p>
                      )}
                      <p className="data-mono mt-auto pt-2 text-sm font-semibold text-primary">
                        {formatMoneyPrecise(product.salePrice)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Cart */}
      <section
        className="flex h-fit flex-col rounded-lg border border-border bg-card lg:sticky lg:top-24"
        aria-label="Current invoice"
      >
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold tracking-tight">Current invoice</h2>
        </div>

        {/* Member lookup */}
        <div className="border-b border-border p-4">
          <p className="label-caps mb-2 text-muted-foreground">Member (optional)</p>
          {member ? (
            <div className="flex items-center gap-2 rounded border border-border bg-secondary/50 px-3 py-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded bg-primary/10 text-[11px] font-bold text-primary">
                {member.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="data-mono truncate text-[11px] text-muted-foreground">
                  {member.barcode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMemberId(null)}
                aria-label="Remove member"
                className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60"
                aria-hidden="true"
              />
              <input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="Scan ID or enter name…"
                aria-label="Look up a member"
                className="w-full rounded border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {memberMatches.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded border border-border bg-card">
                  {memberMatches.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setMemberId(m.id);
                          setMemberQuery("");
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                      >
                        <UserPlus className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">{m.name}</span>
                        <span className="data-mono ml-auto shrink-0 text-[11px] text-muted-foreground">
                          {m.barcode}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Lines */}
        <div className="max-h-[40vh] overflow-y-auto">
          {lines.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">
              No items yet. Tap a product to add it.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map((line) => (
                <li key={line.productId} className="flex items-start gap-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.product.name}</p>
                    <p className="data-mono text-[12px] text-muted-foreground">
                      {formatMoneyPrecise(line.unit)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                        aria-label={`Decrease ${line.product.name}`}
                        className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        <Minus className="size-3" aria-hidden="true" />
                      </button>
                      <span className="data-mono w-8 text-center text-sm">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        disabled={line.quantity >= line.product.quantity}
                        aria-label={`Increase ${line.product.name}`}
                        className="flex size-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="size-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <p className="data-mono shrink-0 text-sm font-medium">
                    {formatMoneyPrecise(line.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-border p-4">
          <dl className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[13px] text-muted-foreground">Subtotal</dt>
              <dd className="data-mono text-sm">{formatMoneyPrecise(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[13px] text-muted-foreground">
                <label htmlFor="discount">Discount</label>
              </dt>
              <dd>
                <input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="w-28 rounded border border-input bg-background px-2 py-1 text-right text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </dd>
            </div>
          </dl>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-lg font-semibold">Total</p>
            <p className="data-mono text-lg font-bold text-primary">{formatMoney(total)}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="border-t border-border p-4">
          <p className="label-caps mb-2 text-muted-foreground">Payment method</p>
          {paymentMethods.length === 0 ? (
            <p className="rounded border border-border bg-secondary px-3 py-2 text-[13px] text-muted-foreground">
              Add a payment method before taking a sale.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethodId(m.id)}
                  aria-pressed={methodId === m.id}
                  className={`truncate rounded border px-2 py-2.5 text-[13px] font-medium transition-colors ${
                    methodId === m.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
            >
              <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {done && (
            <div
              role="status"
              className="mt-3 flex items-start gap-2 rounded border border-[#2D5A27]/30 bg-[#2D5A27]/5 px-3 py-2 text-[13px] text-[#2D5A27]"
            >
              <Check className="mt-px size-4 shrink-0" aria-hidden="true" />
              <span>Sale recorded as {done}.</span>
            </div>
          )}

          <button
            type="button"
            onClick={finalize}
            disabled={pending || cart.length === 0 || paymentMethods.length === 0}
            className="mt-3 w-full rounded bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#570000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Recording…" : "Finalize sale"}
          </button>
        </div>
      </section>
    </div>
  );
}
