import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionFilterBar } from "@/components/public/CollectionFilterBar";
import { CollectionResults } from "@/components/public/CollectionResults";
import { CollectionGridSkeleton } from "@/components/public/Skeleton";
import { Reveal } from "@/components/ui/Reveal";
import {
  getCollectionContent,
  getCollectionFacets,
  getTimepieces,
} from "@/lib/queries";
import {
  JsonLd,
  clamp,
  collectionJsonLd,
  pageMetadata,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { headline, description } = await getCollectionContent();
  return pageMetadata({
    title: headline,
    description: clamp(description),
    // Canonical without the query string. `?brand=Rolex` is a view of this
    // page, not a page of its own, and every one of them should consolidate
    // here rather than competing with it in the index.
    path: "/collection",
  });
}

/**
 * The collection listing.
 *
 * The header and the filter bar render immediately; the grid arrives inside a
 * Suspense boundary, because it is the only part that has to wait for a
 * filtered query. `searchParams` is deliberately not awaited here — it is
 * handed to `CollectionResults` still as a promise, which is what keeps the
 * shell out of the wait.
 */
export default async function CollectionPage({
  searchParams,
}: PageProps<"/collection">) {
  const [content, facets, all] = await Promise.all([
    getCollectionContent(),
    getCollectionFacets(),
    getTimepieces(),
  ]);

  return (
    <>
      <JsonLd
        data={collectionJsonLd({
          headline: content.headline,
          description: content.description,
          timepieces: all,
        })}
      />

      <header className="shell pt-section-sm pb-12 md:pt-section lg:pb-16">
        <Reveal>
          <h1 className="text-display text-graphite uppercase">
            {content.headline}
          </h1>
          <p className="measure mt-7 text-h3 font-sans text-slate">
            {content.description}
          </p>
        </Reveal>
      </header>

      {/* CollectionFilterBar reads useSearchParams, so it needs a Suspense
          boundary to stay prerenderable. */}
      <Suspense
        fallback={
          // Same wrapper and same control height as the real bar, so the
          // swap is invisible rather than a jump.
          <div className="border-y border-border-grey">
            <div className="shell flex flex-col gap-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
              <div aria-hidden="true" className="h-11 w-64 max-w-full" />
              <div aria-hidden="true" className="h-11 w-44" />
            </div>
          </div>
        }
      >
        <CollectionFilterBar
          facets={facets}
          searchItems={all.map((timepiece) => ({
            label: `${timepiece.brand} ${timepiece.model}`,
            href: `/collection/${timepiece.slug}`,
          }))}
        />
      </Suspense>

      <Suspense
        fallback={
          <CollectionGridSkeleton
            count={Math.min(all.length, 6)}
            className="shell pt-10 pb-section-sm md:pb-section lg:pb-section-lg"
          />
        }
      >
        <CollectionResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}
