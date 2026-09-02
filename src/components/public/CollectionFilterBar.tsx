"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { GooeySearch } from "@/components/public/GooeySearch";
import { cn } from "@/lib/utils";

type Dimension = "all" | "brand" | "era" | "type";

const DIMENSIONS: { key: Dimension; label: string }[] = [
  { key: "all", label: "All" },
  { key: "brand", label: "Brand" },
  { key: "era", label: "Era / Year" },
  { key: "type", label: "Type" },
];

interface Selection {
  brand: string;
  era: string;
  type: string;
  query: string;
}

export interface CollectionFilterBarProps {
  facets: { brands: string[]; eras: string[]; types: string[] };
  /** Every timepiece, for the search box's suggestions. */
  searchItems: { label: string; href: string }[];
}

/**
 * The collection's filter controls.
 *
 * Filtering itself happens in Postgres (see `timepieceWhere` in lib/queries),
 * so this component's only job is to move the URL. Filter state lives in the
 * query string, which is what makes a filtered view linkable and the back
 * button work.
 *
 * The catch with server-side filtering is latency: a pill that only highlights
 * after the server answers feels broken. `useOptimistic` highlights it on the
 * click and hands control back to the URL once the transition commits, and a
 * hairline under the bar shows that the results are still catching up.
 */
export function CollectionFilterBar({
  facets,
  searchItems,
}: CollectionFilterBarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const fromUrl: Selection = {
    brand: params.get("brand") ?? "",
    era: params.get("era") ?? "",
    type: params.get("type") ?? "",
    query: params.get("q") ?? "",
  };

  const [selection, setSelection] = useOptimistic(fromUrl);

  // Which value row is open. Derived from the selection, so a linked
  // ?brand=Rolex arrives with the brand row already expanded.
  const dimension: Dimension = selection.brand
    ? "brand"
    : selection.era
      ? "era"
      : selection.type
        ? "type"
        : "all";

  const values: Record<Exclude<Dimension, "all">, string[]> = {
    brand: facets.brands,
    era: facets.eras,
    type: facets.types,
  };

  const [openRow, setOpenRow] = useOptimistic<Dimension>(dimension);

  const apply = (next: Partial<Selection>, row?: Dimension) => {
    const merged = { ...selection, ...next };
    startTransition(() => {
      setSelection(merged);
      if (row) setOpenRow(row);
      const search = new URLSearchParams();
      if (merged.query) search.set("q", merged.query);
      if (merged.brand) search.set("brand", merged.brand);
      if (merged.era) search.set("era", merged.era);
      if (merged.type) search.set("type", merged.type);
      const qs = search.toString();
      router.replace(qs ? `/collection?${qs}` : "/collection", {
        scroll: false,
      });
    });
  };

  // Switching dimension clears the others, so filters never stack up
  // invisibly behind a collapsed row.
  const selectDimension = (key: Dimension) =>
    apply({ brand: "", era: "", type: "" }, key);

  const activeValue =
    openRow === "brand"
      ? selection.brand
      : openRow === "era"
        ? selection.era
        : openRow === "type"
          ? selection.type
          : "";

  const hasFilters = Boolean(
    selection.query || selection.brand || selection.era || selection.type
  );

  return (
    <div className="relative border-y border-border-grey" aria-busy={isPending}>
      <div className="shell flex flex-col gap-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div
          role="tablist"
          aria-label="Filter the collection"
          className="-mx-1 flex flex-wrap items-center gap-x-1 gap-y-2"
        >
          {DIMENSIONS.map((d) => {
            const selected = openRow === d.key;
            return (
              <button
                key={d.key}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={d.key === "all" ? undefined : "filter-values"}
                onClick={() => selectDimension(d.key)}
                className={cn(
                  "min-h-11 rounded-full px-4 text-small font-medium transition-colors duration-fast",
                  selected
                    ? "bg-navy text-pure-white"
                    : "text-slate hover:bg-soft-grey hover:text-graphite"
                )}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <GooeySearch
          items={searchItems.map((item) => item.label)}
          placeholder="Search The Collection..."
          onSelect={(label) => {
            const match = searchItems.find((item) => item.label === label);
            if (match) router.push(match.href);
          }}
          className="shrink-0 self-start lg:self-auto"
        />
      </div>

      {openRow !== "all" && (
        <div
          id="filter-values"
          className="shell border-t border-border-grey py-5"
        >
          <div className="-mx-1 flex flex-wrap items-center gap-x-1 gap-y-2">
            {values[openRow].map((value) => {
              const selected = activeValue === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    apply({ [openRow]: selected ? "" : value }, openRow)
                  }
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-small transition-colors duration-fast",
                    selected
                      ? "border-navy bg-navy/8 text-navy"
                      : "border-border-grey text-slate hover:border-navy/40 hover:text-graphite"
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* One hairline, bottom edge of the bar. Enough to say "working" on a
          slow connection without a spinner sitting over the results. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 -bottom-px h-px origin-left bg-navy transition-opacity duration-fast",
          isPending
            ? "animate-[iwm-filter-progress_1.1s_ease-in-out_infinite] opacity-100 motion-reduce:animate-none motion-reduce:scale-x-100"
            : "scale-x-0 opacity-0"
        )}
      />

      {hasFilters && (
        <div className="shell border-t border-border-grey py-4">
          <button
            type="button"
            onClick={() =>
              apply({ query: "", brand: "", era: "", type: "" }, "all")
            }
            className="inline-flex min-h-11 items-center gap-2 text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark"
          >
            <X aria-hidden="true" className="size-4" />
            Clear filters
            {selection.query && (
              <span className="text-slate">· “{selection.query}”</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default CollectionFilterBar;
