"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { CollectionGrid } from "@/components/public/CollectionGrid";
import { GooeySearch } from "@/components/public/GooeySearch";
import { filterTimepieces } from "@/lib/fixtures";
import type { Timepiece } from "@/types";
import { primaryImage } from "@/types";
import { cn } from "@/lib/utils";

type Dimension = "all" | "brand" | "era" | "type";

const DIMENSIONS: { key: Dimension; label: string }[] = [
  { key: "all", label: "All" },
  { key: "brand", label: "Brand" },
  { key: "era", label: "Era / Year" },
  { key: "type", label: "Type" },
];

export interface CollectionBrowserProps {
  /** The published collection, fetched on the server. */
  timepieces: Timepiece[];
  /** Filter values, derived on the server from the same records. */
  facets: { brands: string[]; eras: string[]; types: string[] };
}

/**
 * Search and filtering for the collection.
 *
 * The records arrive as props from the server component, so filtering stays
 * instant and client side while the data itself comes from the database.
 * Filter state lives in the URL, so a filtered view can be linked and
 * survives the back button; the header's search box also lands here as ?q=.
 */
export function CollectionBrowser({
  timepieces,
  facets,
}: CollectionBrowserProps) {
  const VALUES: Record<Exclude<Dimension, "all">, string[]> = {
    brand: facets.brands,
    era: facets.eras,
    type: facets.types,
  };

  const router = useRouter();
  const params = useSearchParams();

  const query = params.get("q") ?? "";
  const brand = params.get("brand") ?? "";
  const era = params.get("era") ?? "";
  const type = params.get("type") ?? "";

  // Which value row is open. Derived from the URL on first render so a linked
  // ?brand=Rolex arrives with the brand row already expanded.
  const [dimension, setDimension] = useState<Dimension>(() => {
    if (brand) return "brand";
    if (era) return "era";
    if (type) return "type";
    return "all";
  });

  const setParams = useCallback(
    (next: Record<string, string | null>) => {
      const search = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value) search.set(key, value);
        else search.delete(key);
      }
      const qs = search.toString();
      router.replace(qs ? `/collection?${qs}` : "/collection", {
        scroll: false,
      });
    },
    [params, router]
  );

  const selectDimension = (key: Dimension) => {
    setDimension(key);
    // Switching dimension clears the others, so filters never stack up
    // invisibly behind a collapsed row.
    if (key === "all") setParams({ brand: null, era: null, type: null });
    else setParams({ brand: null, era: null, type: null });
  };

  const activeValue = dimension === "brand" ? brand : dimension === "era" ? era : dimension === "type" ? type : "";

  const results = useMemo(
    () => filterTimepieces(timepieces, { query, brand, era, type }),
    [timepieces, query, brand, era, type]
  );

  const searchLabels = useMemo(
    () => timepieces.map((t) => `${t.brand} ${t.model}`),
    [timepieces]
  );

  const hasFilters = Boolean(query || brand || era || type);

  const gridItems = results.map((t) => ({
    id: t.id,
    slug: t.slug,
    brand: t.brand,
    model: t.model,
    referenceNumber: t.referenceNumber,
    year: t.year,
    image: primaryImage(t)?.src,
    imageAlt: primaryImage(t)?.alt,
  }));

  return (
    <>
      {/* ---- Filter bar ---------------------------------------------- */}
      <div className="border-y border-border-grey">
        <div className="shell flex flex-col gap-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div
            role="tablist"
            aria-label="Filter the collection"
            className="-mx-1 flex flex-wrap items-center gap-x-1 gap-y-2"
          >
            {DIMENSIONS.map((d) => {
              const selected = dimension === d.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
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
            items={searchLabels}
            placeholder="Search The Collection..."
            onSelect={(label) => {
              const match = timepieces.find(
                (t) => `${t.brand} ${t.model}` === label
              );
              if (match) router.push(`/collection/${match.slug}`);
            }}
            className="shrink-0 self-start lg:self-auto"
          />
        </div>

        {/* ---- Value row ---------------------------------------------- */}
        {dimension !== "all" && (
          <div className="shell border-t border-border-grey py-5">
            <div className="-mx-1 flex flex-wrap items-center gap-x-1 gap-y-2">
              {VALUES[dimension].map((value) => {
                const selected = activeValue === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setParams({ [dimension]: selected ? null : value })
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
      </div>

      {/* ---- Results ------------------------------------------------- */}
      <div className="shell pt-10 pb-section-sm md:pb-section lg:pb-section-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p aria-live="polite" className="text-small text-slate">
            {results.length === timepieces.length
              ? `${timepieces.length} timepieces`
              : `${results.length} of ${timepieces.length} timepieces`}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setDimension("all");
                setParams({ q: null, brand: null, era: null, type: null });
              }}
              className="inline-flex min-h-11 items-center gap-2 text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark"
            >
              <X aria-hidden="true" className="size-4" />
              Clear filters
            </button>
          )}
        </div>

        {results.length > 0 ? (
          <CollectionGrid items={gridItems} className="mt-10" />
        ) : (
          <div className="mt-16 border-t border-border-grey pt-16 text-center">
            <p className="font-display text-h2 text-graphite">
              Nothing matches that.
            </p>
            <p className="measure mx-auto mt-5 text-body text-slate">
              {query
                ? `No timepiece in the collection matches “${query}”. Try a brand, a reference number, or a year.`
                : "No timepiece in the collection matches those filters."}
            </p>
            <button
              type="button"
              onClick={() => {
                setDimension("all");
                setParams({ q: null, brand: null, era: null, type: null });
              }}
              className="mt-8 inline-flex min-h-11 items-center rounded-full bg-navy px-6 text-small font-medium tracking-caption text-pure-white uppercase transition-colors duration-base hover:bg-navy-dark"
            >
              Show the whole collection
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default CollectionBrowser;
