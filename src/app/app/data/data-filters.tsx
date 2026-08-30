"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

/**
 * Search and date-range controls, written to the URL so a filtered view is
 * shareable, survives a reload, and drives the CSV export with the same terms.
 */
export function DataFilters({
  dataset,
  dateLabel,
}: {
  dataset: string;
  dateLabel?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(params.get("q") ?? "");
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  // Reset the box when switching datasets, which clears the query too.
  useEffect(() => {
    setSearch(params.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset]);

  function push(next: URLSearchParams) {
    next.set("dataset", dataset);
    next.delete("page");
    startTransition(() => router.replace(`/app/data?${next}`, { scroll: false }));
  }

  // Debounce the search so typing does not fire a request per keystroke.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (search === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search) next.set("q", search);
      else next.delete("q");
      push(next);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function setDate(key: "from" | "to", value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  }

  const hasFilters = Boolean(search || from || to);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <label htmlFor="data-search" className="label-caps mb-1 block text-muted-foreground">
          Search
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-[calc(50%+8px)] size-4 -translate-y-1/2 text-muted-foreground/60"
          aria-hidden="true"
        />
        <input
          id="data-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search this table…"
          className="w-full rounded border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {dateLabel && (
        <>
          <div>
            <label htmlFor="data-from" className="label-caps mb-1 block text-muted-foreground">
              {dateLabel} from
            </label>
            <input
              id="data-from"
              type="date"
              value={from}
              onChange={(e) => setDate("from", e.target.value)}
              className="rounded border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="data-to" className="label-caps mb-1 block text-muted-foreground">
              To
            </label>
            <input
              id="data-to"
              type="date"
              value={to}
              onChange={(e) => setDate("to", e.target.value)}
              className="rounded border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            startTransition(() =>
              router.replace(`/app/data?dataset=${dataset}`, { scroll: false })
            );
          }}
          className="flex items-center gap-1.5 rounded border border-border px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <X className="size-3.5" aria-hidden="true" />
          Clear
        </button>
      )}
    </div>
  );
}
