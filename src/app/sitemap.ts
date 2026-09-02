import type { MetadataRoute } from "next";
import { getArticles, getTimepieces } from "@/lib/queries";
import { absolute } from "@/lib/seo";

/**
 * Generated from the database, so a timepiece published this morning is in the
 * sitemap this morning.
 *
 * Only published records are listed, because that is all `getTimepieces` and
 * `getArticles` return. Unpublished drafts are not merely low priority: they
 * 404, and listing a URL that 404s is how a sitemap loses a crawler's trust.
 *
 * `/collection?brand=Rolex` and its siblings are left out on purpose. They are
 * filtered views of a page that is already listed, and the canonical tag on
 * each points back at `/collection`.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [timepieces, articles] = await Promise.all([
    getTimepieces(),
    getArticles(),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = (
    [
      { url: absolute("/"), changeFrequency: "monthly", priority: 1 },
      { url: absolute("/collection"), changeFrequency: "weekly", priority: 0.9 },
      { url: absolute("/journal"), changeFrequency: "weekly", priority: 0.8 },
      { url: absolute("/about"), changeFrequency: "yearly", priority: 0.5 },
    ] as const
  ).map((page) => ({ ...page, lastModified: now }));

  return [
    ...staticPages,
    ...timepieces.map((timepiece) => ({
      url: absolute(`/collection/${timepiece.slug}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...articles.map((article) => ({
      url: absolute(`/journal/${article.slug}`),
      // The article's own date, which is the one thing here a crawler can act
      // on. The static pages have no per-page timestamp to give.
      lastModified: new Date(`${article.publishedAt}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
