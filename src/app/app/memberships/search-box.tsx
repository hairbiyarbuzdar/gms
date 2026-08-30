"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";

/**
 * Search by name, phone, or barcode (FR-21).
 * Debounced and written to the URL, so a result list is shareable and
 * survives a reload.
 */
export function SearchBox({ tab }: { tab: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (value === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set("q", value);
      else next.delete("q");
      next.delete("page");
      next.set("tab", tab);
      startTransition(() => router.replace(`/app/memberships?${next}`, { scroll: false }));
    }, 300);

    return () => clearTimeout(timer);
  }, [value, params, router, tab]);

  return (
    <div className="relative w-full sm:w-80">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search name, phone, or barcode…"
        aria-label="Search members"
        className="w-full rounded border border-input bg-card py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
