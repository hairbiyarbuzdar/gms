import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Table2 } from "lucide-react";
import { getTenantContext } from "@/lib/tenant-context";
import { formatDate, formatMoneyPrecise } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { DataFilters } from "./data-filters";
import {
  DATASETS,
  DATASET_META,
  PAGE_SIZE,
  getDataset,
  parseDataset,
  type Column,
  type DataRow,
} from "./data-sources";

export const metadata = { title: "Data Viewer" };

function cell(row: DataRow, column: Column) {
  const value = row[column.key];
  if (value === null || value === undefined || value === "") return "—";

  if (column.type === "date") return formatDate(new Date(String(value)));
  if (column.type === "money") return formatMoneyPrecise(Number(value));
  return String(value);
}

export default async function DataViewerPage({
  searchParams,
}: {
  searchParams: Promise<{
    dataset?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  await getTenantContext();

  const sp = await searchParams;
  const dataset = parseDataset(sp.dataset);
  const meta = DATASET_META[dataset];
  const search = sp.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const result = await getDataset({
    dataset,
    search,
    from: sp.from,
    to: sp.to,
    page,
  });

  const from = result.total === 0 ? 0 : (result.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(result.page * PAGE_SIZE, result.total);

  const query = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    p.set("dataset", dataset);
    if (search) p.set("q", search);
    if (sp.from) p.set("from", sp.from);
    if (sp.to) p.set("to", sp.to);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return p.toString();
  };

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Tools"
        title="Data Viewer"
        description="Browse, search, and export the raw records behind every module. Read-only."
        action={
          <a
            href={`/app/data/export?${query({})}`}
            className="flex items-center gap-2 rounded border border-primary bg-card px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </a>
        }
      />

      {/* Dataset tabs */}
      <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-border pb-px" aria-label="Datasets">
        {DATASETS.map((key) => {
          const active = key === dataset;
          return (
            <Link
              key={key}
              href={`/app/data?dataset=${key}`}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap border-b-[3px] px-3 pb-3 pt-1 text-sm transition-colors ${
                active
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {DATASET_META[key].label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-4 text-[13px] text-muted-foreground">{meta.description}</p>

      {/* Toolbar */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 rounded-lg border border-border bg-card p-4">
        <DataFilters dataset={dataset} dateLabel={meta.dateLabel} />
        <p className="text-[13px] text-muted-foreground">
          {result.total === 0 ? "No rows" : `Showing ${from}–${to} of ${result.total}`}
        </p>
      </div>

      {/* Table */}
      <div className="mt-4">
        {result.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center">
            <Table2 className="size-8 text-muted-foreground/50" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Nothing to show</p>
            <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
              {search || sp.from || sp.to
                ? "No rows match these filters."
                : "This table has no records yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-primary-tint">
                  {meta.columns.map((column) => (
                    <th
                      key={column.key}
                      className={`label-caps whitespace-nowrap px-4 py-3 text-muted-foreground ${
                        column.numeric ? "text-right" : ""
                      }`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    {meta.columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-sm ${
                          column.numeric ? "data-mono text-right" : ""
                        } ${column.type === "text" ? "" : "whitespace-nowrap"}`}
                      >
                        {cell(row, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {result.pageCount > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <PageLink
            href={`/app/data?${query({ page: String(result.page - 1) })}`}
            disabled={result.page <= 1}
            label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </PageLink>
          <span className="data-mono text-[13px] text-muted-foreground">
            {result.page} / {result.pageCount}
          </span>
          <PageLink
            href={`/app/data?${query({ page: String(result.page + 1) })}`}
            disabled={result.page >= result.pageCount}
            label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </PageLink>
        </div>
      )}
    </main>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const base =
    "flex size-8 items-center justify-center rounded border border-border transition-colors";

  if (disabled) {
    return (
      <span aria-disabled="true" className={`${base} opacity-40`}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={`${base} hover:border-primary hover:text-primary`}>
      {children}
    </Link>
  );
}
