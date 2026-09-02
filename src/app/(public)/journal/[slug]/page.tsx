import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ArticleBody } from "@/components/public/ArticleBody";
import { Reveal } from "@/components/ui/Reveal";
import { getSiteSettings } from "@/lib/content";
import {
  CATEGORY_LABELS,
  formatArticleDate,
  getArticleBySlug,
  getArticles,
  getRelatedArticles,
} from "@/lib/queries";
import {
  JsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
  clamp,
  pageMetadata,
} from "@/lib/seo";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Not found", robots: { index: false } };

  const metadata = await pageMetadata({
    title: article.title,
    // The excerpt is written to be read on the listing page, which makes it
    // already the right length and tone for a search result.
    description: clamp(article.excerpt) ?? clamp(article.content),
    path: `/journal/${article.slug}`,
    image: article.coverImage,
    imageAlt: article.coverImageAlt,
    type: "article",
  });
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      // `publishedTime` belongs to og:article and nothing else, so the type
      // has to be restated here for TypeScript to accept it.
      type: "article",
      publishedTime: article.publishedAt,
    },
  };
}

/** ~230 words a minute, rounded up. */
function readingMinutes(content: string): number {
  return Math.max(1, Math.round(content.split(/\s+/).length / 230));
}

export default async function ArticlePage({
  params,
}: PageProps<"/journal/[slug]">) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [related, settings] = await Promise.all([
    getRelatedArticles(slug, 3),
    getSiteSettings(),
  ]);

  return (
    <>
      <JsonLd data={articleJsonLd(article, settings)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: settings.title, path: "/" },
          { name: "Journal", path: "/journal" },
          { name: article.title, path: `/journal/${article.slug}` },
        ])}
      />

      <div className="shell pt-section-sm md:pt-section">
        <Link
          href="/journal"
          className="group inline-flex min-h-11 items-center gap-2 text-small font-medium text-slate transition-colors duration-fast hover:text-graphite"
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-4 transition-transform duration-base ease-out-museum group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          />
          Back to the journal
        </Link>
      </div>

      <article className="pt-8 pb-section-sm md:pb-section lg:pb-section-lg">
        <header className="shell">
          <Reveal>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-navy/30 bg-navy/6 px-3 py-1.5 text-caption tracking-label text-navy uppercase">
                {CATEGORY_LABELS[article.category]}
              </span>
              <p className="text-caption tracking-caption text-slate uppercase">
                <time dateTime={article.publishedAt}>
                  {formatArticleDate(article.publishedAt)}
                </time>
                {" · "}
                {readingMinutes(article.content)} min read
              </p>
            </div>

            <h1 className="mt-7 max-w-[24ch] text-h1 text-graphite uppercase">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="measure mt-5 font-display text-h2 text-slate">
                {article.subtitle}
              </p>
            )}
          </Reveal>
        </header>

        {article.coverImage && (
          <Reveal delay={0.06} className="shell mt-12 lg:mt-16">
            <div className="relative aspect-[16/9] w-full overflow-hidden border border-border-grey bg-soft-grey">
              <Image
                src={article.coverImage}
                alt={article.coverImageAlt ?? ""}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        )}

        <div className="shell mt-14 lg:mt-20">
          <ArticleBody content={article.content} />
        </div>
      </article>

      {/* ---- Related ------------------------------------------------- */}
      {related.length > 0 && (
        <section
          aria-labelledby="related-heading"
          className="border-t border-border-grey"
        >
          <div className="shell section-y">
            <Reveal>
              <h2 id="related-heading" className="eyebrow">
                More from the journal
              </h2>
            </Reveal>

            <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((other, index) => (
                <Reveal key={other.slug} as="li" delay={index * 0.06}>
                  <Link href={`/journal/${other.slug}`} className="group block">
                    <div className="relative aspect-[4/3] w-full overflow-hidden border border-border-grey bg-soft-grey transition-colors duration-base group-hover:border-navy/30">
                      {other.coverImage && (
                        <Image
                          src={other.coverImage}
                          alt={other.coverImageAlt ?? ""}
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                          className="object-cover transition-transform duration-slow ease-out-museum group-hover:scale-[1.04] motion-reduce:transition-none"
                        />
                      )}
                    </div>
                    <p className="mt-5 text-caption tracking-caption text-slate uppercase">
                      {CATEGORY_LABELS[other.category]}
                    </p>
                    <h3 className="mt-3 font-display text-h3 text-graphite transition-colors duration-base group-hover:text-navy">
                      {other.title}
                    </h3>
                    <span className="mt-4 inline-flex items-center gap-2 text-small font-medium text-navy">
                      Read Story
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform duration-base ease-out-museum group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                      />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
