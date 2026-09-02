import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AboutToc } from "@/components/public/AboutToc";
import { AnimatedLinkButton } from "@/components/ui/AnimatedButton";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteSettings } from "@/lib/content";
import { getAboutContent } from "@/lib/queries";
import { JsonLd, absolute, clamp, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { header } = await getAboutContent();
  return pageMetadata({
    title: header.headline,
    description: clamp(header.lede),
    path: "/about",
  });
}

export default async function AboutPage() {
  const [{ header, sections }, settings] = await Promise.all([
    getAboutContent(),
    getSiteSettings(),
  ]);

  const tocItems = sections.map(({ id, number, navLabel }) => ({
    id,
    number,
    navLabel,
  }));

  return (
    <>
      {/* An "about us" page maps onto AboutPage, and its subject is the
          museum declared on the homepage. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: absolute("/about"),
          name: `${header.headline} — ${settings.title}`,
          description: header.lede,
          mainEntity: { "@id": `${absolute("/")}#museum` },
          // The six sections, so a crawler can see the page's structure
          // without parsing the prose.
          hasPart: sections.map((section) => ({
            "@type": "WebPageElement",
            name: section.title,
            headline: section.headline,
            url: `${absolute("/about")}#${section.id}`,
          })),
        }}
      />

      <header className="shell pt-section-sm pb-section-sm md:pt-section lg:pb-section">
        <Reveal>
          <h1 className="text-display text-graphite uppercase">
            {header.headline}
          </h1>
          <p className="measure mt-7 text-h3 font-sans text-slate">
            {header.lede}
          </p>
        </Reveal>
      </header>

      <div className="shell border-t border-border-grey">
        <div className="lg:grid lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] lg:gap-12">
          <div className="hidden lg:block">
            <AboutToc items={tocItems} />
          </div>

          <div>
            {sections.map((section, index) => {
              // Photo and text swap sides each section so the page has a
              // rhythm rather than a single column of images down one edge.
              const photoFirst = index % 2 === 1;

              return (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-heading`}
                  // Anchors have to clear the fixed header when jumped to.
                  className="scroll-mt-header py-section-sm first:pt-section-sm md:py-section lg:scroll-mt-header-lg lg:py-section-lg"
                >
                  <div
                    className={cn(
                      "grid gap-10 lg:items-center lg:gap-14",
                      // The photograph always takes the wider share. Because
                      // the two get reordered on alternating sections, the
                      // column template has to be mirrored as well, or the
                      // photo lands in the narrow column every other time.
                      photoFirst
                        ? "lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]"
                        : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]"
                    )}
                  >
                    <Reveal
                      className={cn(photoFirst && "lg:order-last")}
                    >
                      <p className="eyebrow flex items-center gap-3">
                        <span className="tabular-nums">{section.number}</span>
                        <span
                          aria-hidden="true"
                          className="h-px w-8 bg-border-grey"
                        />
                        {section.title}
                      </p>

                      <h2
                        id={`${section.id}-heading`}
                        className="mt-6 max-w-[20ch] text-h2 text-graphite"
                      >
                        {section.headline}
                      </h2>

                      <div className="mt-8 flex flex-col gap-6">
                        {section.body.map((paragraph) => (
                          <p
                            key={paragraph.slice(0, 24)}
                            className="measure text-body text-slate"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {section.furtherReading && (
                        <Link
                          href={section.furtherReading.href}
                          className="group mt-8 inline-flex min-h-11 items-center gap-2 text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark"
                        >
                          Read {section.furtherReading.label}
                          <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform duration-base ease-out-museum group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                          />
                        </Link>
                      )}
                    </Reveal>

                    <Reveal delay={0.08}>
                      <div className="relative aspect-[4/3] w-full overflow-hidden border border-border-grey bg-soft-grey">
                        <Image
                          src={section.image}
                          alt={section.imageAlt}
                          fill
                          sizes="(min-width: 1024px) 45vw, 100vw"
                          className="object-cover"
                          priority={index === 0}
                        />
                      </div>
                    </Reveal>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---- Closing CTA --------------------------------------------- */}
      <section className="border-t border-border-grey">
        <div className="shell flex flex-col items-center py-section-lg text-center lg:py-section-xl">
          <Reveal>
            <h2 className="mx-auto max-w-[16ch] text-display text-graphite">
              See what is here.
            </h2>
            <p className="mx-auto mt-8 max-w-[44ch] text-body text-slate">
              Every watch currently on display, with what is known about each
              one.
            </p>
            <div className="mt-12 flex justify-center">
              <AnimatedLinkButton href="/collection">
                Explore the Collection
                <ArrowRight aria-hidden="true" className="size-4" />
              </AnimatedLinkButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
