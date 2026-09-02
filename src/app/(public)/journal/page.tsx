import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedLinkButton } from "@/components/ui/AnimatedButton";
import { Reveal } from "@/components/ui/Reveal";
import {
  CATEGORY_LABELS,
  formatArticleDate,
  getFeaturedArticle,
  getJournalContent,
  getStoryArticles,
} from "@/lib/queries";
import { JsonLd, absolute, clamp, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { headline, description, heroImage } = await getJournalContent();
  return pageMetadata({
    title: headline,
    description: clamp(description),
    path: "/journal",
    image: heroImage,
  });
}

export default async function JournalPage() {
  const [content, featuredArticle, storyArticles] = await Promise.all([
    getJournalContent(),
    getFeaturedArticle(),
    getStoryArticles(),
  ]);
  const {
    headline,
    subhead,
    description,
    heroImage,
    heroImageAlt,
    archive,
    cta,
  } = content;
  const articles = [featuredArticle, ...storyArticles].filter(
    (article): article is NonNullable<typeof article> => Boolean(article)
  );

  return (
    <>
      {/* The journal as a list of its articles, in the order they are shown. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "@id": `${absolute("/journal")}#blog`,
          url: absolute("/journal"),
          name: `${headline} — ${subhead}`,
          description,
          blogPost: articles.map((article) => ({
            "@type": "BlogPosting",
            url: absolute(`/journal/${article.slug}`),
            headline: article.title,
            datePublished: article.publishedAt,
          })),
        }}
      />

      {/* ---------------------------------------------------------------- */}
      {/* HERO                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="shell pt-section-sm pb-16 md:pt-section lg:pb-24">
        <Reveal>
          <h1 className="text-display text-graphite uppercase">{headline}</h1>
          <p className="mt-6 font-display text-h2 text-graphite">{subhead}</p>
          <p className="measure mt-6 text-body text-slate">{description}</p>
        </Reveal>

        <Reveal delay={0.08} className="mt-14 lg:mt-20">
          <div className="relative aspect-[16/9] w-full overflow-hidden border border-border-grey bg-soft-grey">
            <Image
              src={heroImage}
              alt={heroImageAlt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FEATURED                                                         */}
      {/* ---------------------------------------------------------------- */}
      {featuredArticle && (
        <section className="shell section-y border-t border-border-grey">
          <Reveal>
            <p className="eyebrow">Featured</p>
          </Reveal>

          <Reveal delay={0.06} className="mt-10">
            <article className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
              <Link
                href={`/journal/${featuredArticle.slug}`}
                aria-label={featuredArticle.title}
                tabIndex={-1}
                className="group block"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden border border-border-grey bg-soft-grey transition-colors duration-base group-hover:border-navy/30">
                  {featuredArticle.coverImage && (
                    <Image
                      src={featuredArticle.coverImage}
                      alt={featuredArticle.coverImageAlt ?? ""}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover transition-transform duration-slow ease-out-museum group-hover:scale-[1.03] motion-reduce:transition-none"
                    />
                  )}
                </div>
              </Link>

              <div>
                <p className="text-caption tracking-caption text-slate uppercase">
                  {CATEGORY_LABELS[featuredArticle.category]} ·{" "}
                  <time dateTime={featuredArticle.publishedAt}>
                    {formatArticleDate(featuredArticle.publishedAt)}
                  </time>
                </p>
                <h2 className="mt-5 text-h1 text-graphite uppercase">
                  <Link
                    href={`/journal/${featuredArticle.slug}`}
                    className="transition-colors duration-base hover:text-navy"
                  >
                    {featuredArticle.title}
                  </Link>
                </h2>
                {featuredArticle.subtitle && (
                  <p className="mt-4 font-display text-h3 text-slate">
                    {featuredArticle.subtitle}
                  </p>
                )}
                <p className="measure mt-6 text-body text-slate">
                  {featuredArticle.excerpt}
                </p>
                <AnimatedLinkButton
                  href={`/journal/${featuredArticle.slug}`}
                  className="mt-10"
                >
                  Read Story
                  <ArrowRight aria-hidden="true" className="size-4" />
                </AnimatedLinkButton>
              </div>
            </article>
          </Reveal>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* STORIES                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="shell section-y border-t border-border-grey">
        <Reveal>
          <p className="eyebrow">Stories</p>
        </Reveal>

        <ul className="mt-10 flex flex-col">
          {storyArticles.map((article, index) => (
            <Reveal key={article.slug} as="li" delay={index * 0.06}>
              <Link
                href={`/journal/${article.slug}`}
                className="group grid items-start gap-6 border-t border-border-grey py-10 transition-colors duration-base hover:bg-pure-white sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-10 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-16"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden border border-border-grey bg-soft-grey">
                  {article.coverImage && (
                    <Image
                      src={article.coverImage}
                      alt={article.coverImageAlt ?? ""}
                      fill
                      sizes="(min-width: 1024px) 18rem, (min-width: 640px) 14rem, 100vw"
                      className="object-cover transition-transform duration-slow ease-out-museum group-hover:scale-[1.04] motion-reduce:transition-none"
                    />
                  )}
                </div>

                <div>
                  <p className="text-caption tracking-caption text-slate uppercase">
                    {CATEGORY_LABELS[article.category]} ·{" "}
                    <time dateTime={article.publishedAt}>
                      {formatArticleDate(article.publishedAt)}
                    </time>
                  </p>
                  <h3 className="mt-4 text-h2 text-graphite uppercase transition-colors duration-base group-hover:text-navy">
                    {article.title}
                  </h3>
                  <p className="measure mt-4 text-body text-slate">
                    {article.excerpt}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-small font-medium text-navy">
                    Read Story
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-base ease-out-museum group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FROM THE ARCHIVE                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="shell section-y border-t border-border-grey">
        <Reveal>
          <p className="eyebrow">{archive.label}</p>
          <p className="measure mt-6 text-h3 font-sans text-slate">
            {archive.description}
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <ul className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:gap-y-16">
            {archive.items.map((item) => (
              <li key={item.id}>
                <div className="relative aspect-[3/2] w-full overflow-hidden border border-border-grey bg-soft-grey">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="(min-width: 640px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-6 font-display text-h3 text-graphite uppercase">
                  {item.title}
                </h3>
                <p className="measure mt-3 text-small text-slate">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CLOSING CTA                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-border-grey">
        <div className="shell flex flex-col items-center py-section-lg text-center lg:py-section-xl">
          <Reveal>
            <h2 className="mx-auto max-w-[16ch] text-display text-graphite">
              {cta.headline}
            </h2>
            <p className="mx-auto mt-8 max-w-[46ch] text-body text-slate">
              {cta.body}
            </p>
            <div className="mt-12 flex justify-center">
              <AnimatedLinkButton href={cta.buttonHref}>
                {cta.buttonText}
                <ArrowRight aria-hidden="true" className="size-4" />
              </AnimatedLinkButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
