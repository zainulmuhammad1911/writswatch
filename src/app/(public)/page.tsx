import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { AboutImage } from "@/components/public/AboutImage";
import { CollectionStats } from "@/components/public/CollectionStats";
import { CylinderCarousel } from "@/components/public/CylinderCarousel";
import { FeaturedTimepieces } from "@/components/public/FeaturedTimepieces";
import { HERO_SENTINEL_ID } from "@/components/public/Header";
import { LiquidMetalLink } from "@/components/public/LiquidMetalButton";
import { PerspectiveGrid } from "@/components/public/PerspectiveGrid";
import { PixelatedImageTrail } from "@/components/public/PixelatedImageTrail";
import { AnimatedLinkButton } from "@/components/ui/AnimatedButton";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteSettings } from "@/lib/content";
import {
  countTimepieces,
  getFeaturedTimepieces,
  getHomeContent,
} from "@/lib/queries";
import { JsonLd, clamp, museumJsonLd, pageMetadata } from "@/lib/seo";
import { primaryImage } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const [{ about }, settings] = await Promise.all([
    getHomeContent(),
    getSiteSettings(),
  ]);
  return pageMetadata({
    // No `title` here: the homepage keeps the root layout's default rather
    // than rendering as "Home — Indonesia Wristwatch Museum".
    description:
      clamp(settings.seoDescription) ??
      clamp(about.body[0]) ??
      settings.description,
    path: "/",
  });
}

/** Fourteen images: enough to make the cylinder wide enough to reach the edges. */
const heroImages = Array.from({ length: 14 }, (_, i) => ({
  src: `/images/carousel/${i + 1}.jpg`,
  alt: "",
}));

const trailImages = Array.from(
  { length: 5 },
  (_, i) => `/trail-images/${i + 1}.jpg`
);

export default async function HomePage() {
  const [content, featuredTimepieces, settings, timepieceCount] =
    await Promise.all([
      getHomeContent(),
      getFeaturedTimepieces(),
      getSiteSettings(),
      countTimepieces(),
    ]);
  const { hero, about, collection, featured, cta, stats } = content;

  return (
    <>
      {/* The museum itself, declared once on the homepage. Every other page's
          structured data points back at this `@id`. */}
      <JsonLd
        data={museumJsonLd(settings, { timepieces: timepieceCount })}
      />

      {/* ---------------------------------------------------------------- */}
      {/* HERO                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section
        id={HERO_SENTINEL_ID}
        className="relative flex h-[100dvh] min-h-[640px] flex-col overflow-hidden"
      >
        <div className="absolute inset-0">
          <PerspectiveGrid />
        </div>

        {/* Title and tagline sit above the watches; the cylinder gets the whole
            lower half of the hero to run edge to edge. */}
        <div className="pointer-events-none relative flex flex-1 flex-col pt-header lg:pt-header-lg">
          <div className="shell pt-10 text-center sm:pt-12">
            <h1 className="text-display text-graphite uppercase">
              {/* One word per line, from whatever the headline is set to. */}
              {hero.headline.split(" ").map((word, index) => (
                <span key={word} className="block">
                  {word}
                  {index < hero.headline.split(" ").length - 1 && (
                    <span className="sr-only"> </span>
                  )}
                </span>
              ))}
            </h1>
            <p className="mx-auto mt-7 max-w-[38ch] text-h3 font-sans text-slate">
              {hero.tagline}
            </p>
          </div>

          <div aria-hidden="true" className="relative mt-8 min-h-0 flex-1">
            <CylinderCarousel
              images={heroImages}
              className="h-full min-h-0"
              cardWidth={300}
              fadeInset={4}
              cardGap={1.1}
              animationDuration={44}
            />
          </div>
        </div>

        {/* Dissolves the grid and the bottom of the cylinder into the page
            below, so the hero ends rather than stopping. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 lg:h-36"
          style={{
            // Short and weighted to the very bottom: enough to soften the seam
            // into the next section without washing out the watches above it.
            background:
              "linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--color-cool-white) 40%, transparent) 55%, var(--color-cool-white) 92%)",
          }}
        />
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* ABOUT THE MUSEUM                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="shell pt-section-sm pb-section-sm md:pb-section lg:pt-section lg:pb-section-lg">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow">{about.label}</p>
            <h2 className="mt-6 max-w-[14ch] text-h1">{about.headline}</h2>
            <div className="mt-8 flex flex-col gap-6">
              {about.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className="measure text-body text-slate"
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <AnimatedLinkButton href={about.ctaHref} className="mt-10">
              {about.ctaLabel}
              <ArrowRight aria-hidden="true" className="size-4" />
            </AnimatedLinkButton>
          </Reveal>

          <div className="lg:order-last">
            <AboutImage src={about.image} alt={about.imageAlt} />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* THE COLLECTION                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="shell section-y border-t border-border-grey">
        <div className="grid gap-14 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
          <Reveal>
            <p className="eyebrow">{collection.label}</p>
            <h2 className="mt-6 max-w-[18ch] text-h1">{collection.headline}</h2>
            <p className="measure mt-8 text-body text-slate">
              {collection.body}
            </p>
          </Reveal>

          <CollectionStats stats={stats} />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FEATURED TIMEPIECES                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="section-y border-t border-border-grey">
        <div className="shell">
          <Reveal className="text-center">
            <p className="eyebrow">{featured.label}</p>
            <h2 className="mx-auto mt-6 max-w-[16ch] text-h1">
              {featured.headline}
            </h2>
          </Reveal>
        </div>

        <Reveal delay={0.08} className="mt-12 lg:mt-16">
          <FeaturedTimepieces
            items={featuredTimepieces.map((timepiece) => ({
              src: primaryImage(timepiece)?.src ?? "",
              alt: primaryImage(timepiece)?.alt,
              title: `${timepiece.brand.toUpperCase()} · ${timepiece.model} · ${timepiece.year}`,
              slug: timepiece.slug,
            }))}
          />
        </Reveal>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* COLLECTION CTA                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-t border-border-grey">
        <PixelatedImageTrail images={trailImages} />

        <div className="pointer-events-none relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-gutter py-section-lg text-center lg:min-h-[80vh] lg:py-section-xl">
          <Reveal>
            <h2 className="max-w-[12ch] text-display text-graphite">
              {cta.headline}
            </h2>
            <p className="mx-auto mt-8 max-w-[42ch] text-body text-slate">
              {cta.body}
            </p>
            <div className="pointer-events-auto mt-12 flex justify-center">
              <LiquidMetalLink
                href={cta.buttonHref}
                size="lg"
                icon={<ArrowRight className="size-5" aria-hidden="true" />}
              >
                {cta.buttonText}
              </LiquidMetalLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
