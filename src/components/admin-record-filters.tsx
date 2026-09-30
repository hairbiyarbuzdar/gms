"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { BranchOption } from "./admin-branch-action";

export function AdminRecordFilters({
  branches,
  placeholder,
}: {
  branches: BranchOption[];
  placeholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (search === (params.get("q") ?? "")) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search) next.set("q", search);
      else next.delete("q");
      next.delete("page");
      startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, params, pathname, router]);
  return (
    <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto" aria-busy={pending}>
      <div className="relative w-full sm:w-80">
        <Search
          className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="border-border bg-background focus:border-primary focus:ring-primary w-full rounded border py-2.5 pr-3 pl-9 text-[13px] outline-none focus:ring-1"
        />
      </div>
      <select
        aria-label="Filter by branch"
        value={params.get("branch") ?? ""}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          if (event.target.value) next.set("branch", event.target.value);
          else next.delete("branch");
          next.delete("page");
          startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
        }}
        className="border-border bg-background focus:border-primary focus:ring-primary w-full rounded border px-3 py-2.5 text-[13px] outline-none focus:ring-1 sm:w-52"
      >
        <option value="">All branches</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      <span className="sr-only" role="status">
        {pending ? "Updating records" : ""}
      </span>
    </div>
  );
}
