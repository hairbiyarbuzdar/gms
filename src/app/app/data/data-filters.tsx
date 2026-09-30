"use client";

import { useWorkspaceBase } from "@/components/workspace-link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

/**
 * Search and date-range controls, written to the URL so a filtered view is
 * shareable, survives a reload, and drives the CSV export with the same terms.
 */
export function DataFilters({ dataset, dateLabel }: { dataset: string; dateLabel?: string }) {
  const router = useRouter();
  const base = useWorkspaceBase();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(params.get("q") ?? "");
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  function push(next: URLSearchParams) {
    next.set("dataset", dataset);
    next.delete("page");
    startTransition(() => router.replace(`${base}/data?${next}`, { scroll: false }));
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
        <label htmlFor="data-search" className="label-caps text-muted-foreground mb-1 block">
          Search
        </label>
        <Search
          className="text-muted-foreground/60 pointer-events-none absolute top-[calc(50%+8px)] left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          id="data-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search this table…"
          className="border-input bg-background placeholder:text-muted-foreground/60 focus:border-primary focus:ring-primary w-full rounded border py-2 pr-3 pl-9 text-sm transition-colors outline-none focus:ring-1"
        />
      </div>

      {dateLabel && (
        <>
          <div>
            <label htmlFor="data-from" className="label-caps text-muted-foreground mb-1 block">
              {dateLabel} from
            </label>
            <input
              id="data-from"
              type="date"
              value={from}
              onChange={(e) => setDate("from", e.target.value)}
              className="border-input bg-background focus:border-primary focus:ring-primary rounded border px-3 py-2 text-sm transition-colors outline-none focus:ring-1"
            />
          </div>
          <div>
            <label htmlFor="data-to" className="label-caps text-muted-foreground mb-1 block">
              To
            </label>
            <input
              id="data-to"
              type="date"
              value={to}
              onChange={(e) => setDate("to", e.target.value)}
              className="border-input bg-background focus:border-primary focus:ring-primary rounded border px-3 py-2 text-sm transition-colors outline-none focus:ring-1"
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
              router.replace(`${base}/data?dataset=${dataset}`, { scroll: false })
            );
          }}
          className="border-border text-muted-foreground hover:border-primary hover:text-primary flex items-center gap-1.5 rounded border px-3 py-2 text-[13px] transition-colors"
        >
          <X className="size-3.5" aria-hidden="true" />
          Clear
        </button>
      )}
    </div>
  );
}
