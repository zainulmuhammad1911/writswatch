import Link from "next/link";
import { CollectionGrid } from "@/components/public/CollectionGrid";
import { countTimepieces, getTimepieces } from "@/lib/queries";
import { primaryImage } from "@/types";

export interface CollectionResultsProps {
  /**
   * The page's own `searchParams` promise, passed straight through.
   *
   * Awaited here rather than in the page so the header and the filter bar can
   * render before the query resolves. That is what makes the skeleton under
   * this component a fallback rather than a full-page loading screen.
   */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/** The filtered grid. Filtering happens in Postgres, not in the browser. */
export async function CollectionResults({
  searchParams,
}: CollectionResultsProps) {
  const params = await searchParams;
  const filters = {
    query: first(params.q),
    brand: first(params.brand),
    era: first(params.era),
    type: first(params.type),
  };
  const filtered = Object.values(filters).some(Boolean);

  const [results, total] = await Promise.all([
    getTimepieces(filters),
    countTimepieces(),
  ]);

  return (
    <div className="shell pt-10 pb-section-sm md:pb-section lg:pb-section-lg">
      <p aria-live="polite" className="text-small text-slate">
        {filtered
          ? `${results.length} of ${total} timepieces`
          : `${total} timepieces`}
      </p>

      {results.length > 0 ? (
        <CollectionGrid
          className="mt-10"
          items={results.map((timepiece) => ({
            id: timepiece.id,
            slug: timepiece.slug,
            brand: timepiece.brand,
            model: timepiece.model,
            referenceNumber: timepiece.referenceNumber,
            year: timepiece.year,
            image: primaryImage(timepiece)?.src,
            imageAlt: primaryImage(timepiece)?.alt,
          }))}
        />
      ) : (
        <div className="mt-16 border-t border-border-grey pt-16 text-center">
          <p className="font-display text-h2 text-graphite">
            Nothing matches that.
          </p>
          <p className="measure mx-auto mt-5 text-body text-slate">
            {filters.query
              ? `No timepiece in the collection matches “${filters.query}”. Try a brand, a reference number, or a year.`
              : "No timepiece in the collection matches those filters."}
          </p>
          {/* A link, not a button: it clears the query string by navigating,
              which works before the page has hydrated. */}
          <Link
            href="/collection"
            className="mt-8 inline-flex min-h-11 items-center rounded-full bg-navy px-6 text-small font-medium tracking-caption text-pure-white uppercase transition-colors duration-base hover:bg-navy-dark"
          >
            Show the whole collection
          </Link>
        </div>
      )}
    </div>
  );
}

export default CollectionResults;
