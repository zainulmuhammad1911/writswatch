"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { inputClasses } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export interface AdminSearchProps {
  basePath: string;
  placeholder?: string;
  filters?: { key: string; label: string; options: string[] }[];
  /** Set false on lists that filter but do not text-search. */
  searchable?: boolean;
}

/**
 * Search box and filter selects for an admin list.
 *
 * State lives in the URL, so a filtered view survives a refresh, the back
 * button, and being pasted to a colleague. The text input is debounced so
 * typing does not fire a navigation per keystroke.
 */
export function AdminSearch({
  basePath,
  placeholder = "Search",
  filters = [],
  searchable = true,
}: AdminSearchProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  const current = params.toString();

  useEffect(() => {
    if (!searchable) return;
    const handle = setTimeout(() => {
      const next = new URLSearchParams(current);
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      const qs = next.toString();
      if (qs === current) return;
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    }, 300);
    return () => clearTimeout(handle);
  }, [value, current, basePath, router, searchable]);

  function setFilter(key: string, option: string) {
    const next = new URLSearchParams(current);
    if (option && option !== "all") next.set(key, option);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  const hasAny = Boolean(current);

  return (
    <div className="flex flex-wrap items-end gap-4">
      {searchable && (
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="admin-search" className="eyebrow">
            Search
          </label>
          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate"
            />
            <input
              id="admin-search"
              type="search"
              value={value}
              placeholder={placeholder}
              onChange={(e) => setValue(e.target.value)}
              className={cn(inputClasses, "pl-9")}
            />
          </div>
        </div>
      )}

      {filters.map((filter) => (
        <div key={filter.key} className="min-w-[10rem]">
          <label htmlFor={`filter-${filter.key}`} className="eyebrow">
            {filter.label}
          </label>
          <select
            id={`filter-${filter.key}`}
            value={params.get(filter.key) ?? "all"}
            onChange={(e) => setFilter(filter.key, e.target.value)}
            className={cn(inputClasses, "mt-2")}
          >
            {filter.options.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All" : option[0].toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>
      ))}

      {hasAny && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            router.replace(basePath, { scroll: false });
          }}
          className="inline-flex min-h-11 items-center gap-2 px-3 text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark"
        >
          <X aria-hidden="true" className="size-4" />
          Clear
        </button>
      )}
    </div>
  );
}

export default AdminSearch;
