import { Wallet } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { getMethodBalances, getTransfers, type TransferRange } from "./data";
import {
  AddMethodDialog,
  EditMethodDialog,
  ToggleMethodButton,
  TransferDialog,
} from "./method-dialogs";
import { TransferHistory } from "./transfer-history";

export const metadata = { title: "Payment Methods" };

const RANGES = ["all", "today", "week", "month"] as const;

function parseRange(value: string | undefined): TransferRange {
  return (RANGES as readonly string[]).includes(value ?? "")
    ? (value as TransferRange)
    : "all";
}

export default async function PaymentMethodsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange } = await searchParams;
  const range = parseRange(rawRange);

  const [methods, transfers] = await Promise.all([
    getMethodBalances(),
    getTransfers(range),
  ]);

  const active = methods.filter((m) => m.isActive);
  const archived = methods.filter((m) => !m.isActive);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Settings"
        title="Payment Methods"
        description="Cash, wallet, and bank channels used across invoices, renewals, and supplier payments. Each tracks its own running balance from the opening you enter."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <TransferDialog methods={methods} />
            <AddMethodDialog />
          </div>
        }
      />

      <MethodGrid
        heading="Active methods"
        methods={active}
        allMethods={methods}
        empty="No active methods. Add one to start recording money."
      />

      {archived.length > 0 && (
        <MethodGrid
          heading="Archived"
          methods={archived}
          allMethods={methods}
          empty=""
        />
      )}

      <TransferHistory transfers={transfers} range={range} />
    </main>
  );
}

function MethodGrid({
  heading,
  methods,
  allMethods,
  empty,
}: {
  heading: string;
  methods: Awaited<ReturnType<typeof getMethodBalances>>;
  allMethods: Awaited<ReturnType<typeof getMethodBalances>>;
  empty: string;
}) {
  return (
    <section className="mt-8" aria-label={heading}>
      <div className="mb-3 flex items-center gap-3">
        <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="label-caps text-muted-foreground">{heading}</h2>
        <div className="h-px flex-1 bg-border" />
        <span className="data-mono text-[13px] text-muted-foreground">{methods.length}</span>
      </div>

      {methods.length === 0 ? (
        <p className="rounded-lg border border-border bg-card px-4 py-10 text-center text-[13px] text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {methods.map((method) => (
            <li
              key={method.id}
              className={`rounded-lg border border-border bg-card p-4 ${
                method.isActive ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{method.name}</p>
                  <p className="label-caps mt-0.5 text-muted-foreground">
                    Opening · {formatMoney(method.openingBalance)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {method.isActive && (
                    <TransferDialog methods={allMethods} fromId={method.id} compact />
                  )}
                  <EditMethodDialog method={method} />
                  <ToggleMethodButton method={method} />
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-2 border-t border-border pt-3">
                <p className="label-caps text-muted-foreground">Current</p>
                <p
                  className={`data-mono text-xl font-bold ${
                    method.currentBalance < 0 ? "text-destructive" : "text-[#2D5A27]"
                  }`}
                >
                  {formatMoney(method.currentBalance)}
                </p>
              </div>

              {method.usageCount > 0 && (
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {method.usageCount} record{method.usageCount === 1 ? "" : "s"}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
