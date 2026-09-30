import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { db } from "@/lib/db";
import { PlatformShell } from "@/components/platform-shell";
import {
  DATASETS,
  DATASET_META,
  getAdminDataset,
  parseDataset,
  type Column,
  type DataRow,
  type DatasetKey,
} from "@/app/app/data/data-sources";
import { getAdminMethodBalances } from "@/app/app/payment-methods/data";
import { formatDate, formatMoneyPrecise } from "@/lib/format";

const modules: Record<string, { title: string; dataset?: DatasetKey }> = {
  memberships: { title: "Memberships", dataset: "members" },
  inventory: { title: "Inventory", dataset: "products" },
  invoices: { title: "Invoices", dataset: "invoices" },
  suppliers: { title: "Suppliers" },
  expenses: { title: "Expenses", dataset: "expenses" },
  "payment-methods": { title: "Payment Methods" },
  data: { title: "Data Viewer" },
};
const destination: Record<DatasetKey, string> = {
  members: "memberships",
  renewals: "memberships",
  invoices: "invoices",
  products: "inventory",
  stock: "inventory",
  expenses: "expenses",
  transfers: "payment-methods",
};
function cell(row: DataRow, column: Column) {
  const value = row[column.key];
  if (value == null || value === "") return "—";
  if (column.type === "money") return formatMoneyPrecise(Number(value));
  if (column.type === "date") return formatDate(new Date(String(value)));
  return String(value);
}

export default async function AdminModule({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole("ADMIN");
  const { module } = await params;
  const config = modules[module];
  if (!config) notFound();
  const sp = await searchParams;
  const value = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : "");
  const search = value("q").trim().slice(0, 120);
  const branch = value("branch");
  const requestedPage = Number(value("page"));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 100000) : 1;
  const branches = await db.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true },
  });
  if (branch && !branches.some((b) => b.id === branch)) notFound();
  const dataset = config.dataset ?? parseDataset(value("dataset"));
  let columns: Column[];
  let rows: DataRow[];
  let total: number;
  let pageCount: number;
  if (module === "suppliers") {
    const where = {
      ...(branch ? { tenantId: branch } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };
    const [count, records] = await Promise.all([
      db.supplier.count({ where }),
      db.supplier.findMany({
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (page - 1) * 25,
        take: 25,
        select: {
          name: true,
          phone: true,
          email: true,
          address: true,
          tenant: { select: { id: true, name: true } },
        },
      }),
    ]);
    rows = records.map((r) => ({
      name: r.name,
      phone: r.phone,
      email: r.email,
      address: r.address,
      branch: r.tenant.name,
      branchId: r.tenant.id,
    }));
    columns = ["name", "phone", "email", "address"].map((key) => ({
      key,
      label: key[0].toUpperCase() + key.slice(1),
      type: "text",
    }));
    total = count;
    pageCount = Math.max(1, Math.ceil(total / 25));
  } else if (module === "payment-methods") {
    const methods = (await getAdminMethodBalances(branch || undefined)).filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );
    total = methods.length;
    pageCount = Math.max(1, Math.ceil(total / 25));
    rows = methods
      .slice((page - 1) * 25, page * 25)
      .map((m) => ({
        branch: m.branch,
        branchId: m.branchId,
        name: m.name,
        opening: m.openingBalance,
        balance: m.currentBalance,
        status: m.isActive ? "Active" : "Hidden",
      }));
    columns = [
      { key: "name", label: "Method", type: "text" },
      { key: "opening", label: "Opening balance", type: "money" },
      { key: "balance", label: "Current balance", type: "money" },
      { key: "status", label: "Status", type: "text" },
    ];
  } else {
    const result = await getAdminDataset({ dataset, search, page }, branch || undefined);
    ({ rows, total, pageCount } = result);
    columns = DATASET_META[dataset].columns;
  }
  const workspaceModule = module === "data" ? destination[dataset] : module;
  const query = (nextPage: number) =>
    `?${new URLSearchParams({ q: search, branch, dataset, page: String(nextPage) })}`;
  return (
    <PlatformShell role="Admin" userEmail={user.email ?? ""} home="/admin">
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
        <h1 className="text-2xl font-semibold">{config.title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          All branches · Open a branch workspace to create, edit, delete, or print using the same
          tools as the branch portal.
        </p>
        <form className="my-6 flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            Branch
            <select
              name="branch"
              defaultValue={branch}
              className="border-border bg-card rounded border p-2"
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          {module === "data" && (
            <label className="grid gap-1 text-sm">
              Records
              <select
                name="dataset"
                defaultValue={dataset}
                className="border-border bg-card rounded border p-2"
              >
                {DATASETS.map((d) => (
                  <option key={d} value={d}>
                    {DATASET_META[d].label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="grid gap-1 text-sm">
            {module === "invoices" ? "Invoice number or member" : "Search"}
            <input
              name="q"
              type="search"
              defaultValue={search}
              className="border-border bg-card rounded border p-2"
            />
          </label>
          <button className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm">
            Apply filters
          </button>
          <Link href={`/admin/${module}`} className="text-primary p-2 text-sm underline">
            Clear
          </Link>
        </form>
        <details className="border-border mb-6 rounded border p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Create or manage records in a branch
          </summary>
          <div className="mt-3 flex flex-wrap gap-3">
            {branches
              .filter((b) => b.status === "ACTIVE" && (!branch || b.id === branch))
              .map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/branches/${b.id}/${workspaceModule}`}
                  className="border-border text-primary hover:border-primary rounded border px-3 py-2 text-sm"
                >
                  {b.name} →
                </Link>
              ))}
          </div>
        </details>
        <p className="text-muted-foreground mb-3 text-sm">{total} records</p>
        <div className="border-border bg-card overflow-x-auto rounded border">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3">Branch</th>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3">Manage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-border border-t">
                  <td className="px-4 py-3 font-medium">{r.branch}</td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 tabular-nums">
                      {cell(r, c)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    {branches.find((b) => b.id === r.branchId)?.status === "ACTIVE" ? (
                      <Link
                        href={`/admin/branches/${r.branchId}/${workspaceModule}`}
                        className="text-primary underline"
                        aria-label={`Manage ${config.title} in ${r.branch}`}
                      >
                        Open branch
                      </Link>
                    ) : (
                      "Suspended"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-muted-foreground p-8 text-center">No records match these filters.</p>
          )}
        </div>
        <nav aria-label="Pagination" className="mt-4 flex justify-end gap-4 text-sm">
          {page > 1 && (
            <Link href={query(page - 1)} className="text-primary underline">
              Previous
            </Link>
          )}
          <span>
            Page {page} of {pageCount}
          </span>
          {page < pageCount && (
            <Link href={query(page + 1)} className="text-primary underline">
              Next
            </Link>
          )}
        </nav>
      </main>
    </PlatformShell>
  );
}
