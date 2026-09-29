"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { formatDate, formatMoneyPrecise } from "@/lib/format";

type InvoiceRow = {
  id: string;
  number: string;
  soldAt: string;
  total: string;
  customer: string;
  paymentMethod: string;
};

export function InvoiceHistory({ invoices }: { invoices: InvoiceRow[] }) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const matches = invoices.filter((invoice) => invoice.number.toLowerCase().includes(search));

  return (
    <section className="border-border mt-10 border-t pt-6" aria-labelledby="invoice-history-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="invoice-history-title" className="text-lg font-semibold">
            Invoice history
          </h2>
          <p className="text-muted-foreground mt-1 text-[13px]" role="status">
            {search
              ? `${matches.length} of ${invoices.length} invoices`
              : `${invoices.length} invoices · Newest first`}
          </p>
        </div>
        <div className="w-full sm:max-w-sm">
          <label htmlFor="invoice-search" className="label-caps text-muted-foreground mb-1 block">
            Search by invoice number
          </label>
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-3 left-3 size-4"
              aria-hidden="true"
            />
            <input
              id="invoice-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter all or part of an invoice number"
              className="border-input bg-background focus:border-primary focus:ring-primary w-full rounded border py-2.5 pr-3 pl-9 text-sm outline-none focus:ring-1"
            />
          </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="border-border bg-card mt-4 rounded border px-4 py-10 text-center">
          <p className="text-sm font-medium">
            {invoices.length ? "No matching invoices" : "No invoices yet"}
          </p>
          <p className="text-muted-foreground mt-1 text-[13px]">
            {invoices.length
              ? "Try another invoice number or clear your search."
              : "Completed sales will appear here."}
          </p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-primary focus-visible:outline-primary mt-3 rounded px-3 py-2 text-sm hover:underline focus-visible:outline-2"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="border-border bg-card mt-4 overflow-x-auto rounded border">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <caption className="sr-only">Created invoices, newest first</caption>
            <thead>
              <tr className="border-border bg-primary-tint border-b">
                {["Invoice number", "Date", "Customer", "Payment method", "Total"].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className={`label-caps text-muted-foreground px-4 py-3 ${label === "Total" ? "text-right" : ""}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matches.map((invoice) => (
                <tr key={invoice.id} className="border-border border-b last:border-0">
                  <th scope="row" className="data-mono px-4 py-3 font-medium">
                    {invoice.number}
                  </th>
                  <td className="data-mono text-muted-foreground px-4 py-3 whitespace-nowrap">
                    {formatDate(new Date(invoice.soldAt))}
                  </td>
                  <td className="px-4 py-3 text-sm">{invoice.customer}</td>
                  <td className="text-muted-foreground px-4 py-3 text-sm">
                    {invoice.paymentMethod}
                  </td>
                  <td className="data-mono px-4 py-3 text-right font-medium whitespace-nowrap">
                    {formatMoneyPrecise(invoice.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
