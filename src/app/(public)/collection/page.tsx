import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionBrowser } from "@/components/public/CollectionBrowser";
import { Reveal } from "@/components/ui/Reveal";
import { getCollectionFacets, getTimepieces, pageContent } from "@/lib/queries";

const { headline, description } = pageContent.collection;

export const metadata: Metadata = {
  title: "The Collection",
  description,
};

export default async function CollectionPage() {
  const [timepieces, facets] = await Promise.all([
    getTimepieces(),
    getCollectionFacets(),
  ]);

  return (
    <>
      <header className="shell pt-section-sm pb-12 md:pt-section lg:pb-16">
        <Reveal>
          <h1 className="text-display text-graphite uppercase">{headline}</h1>
          <p className="measure mt-7 text-h3 font-sans text-slate">
            {description}
          </p>
        </Reveal>
      </header>

      {/* CollectionBrowser reads useSearchParams, so it needs a Suspense
          boundary to stay statically prerenderable. */}
      <Suspense
        fallback={<div className="shell py-24 text-small text-slate">Loading…</div>}
      >
        <CollectionBrowser timepieces={timepieces} facets={facets} />
      </Suspense>
    </>
  );
}
