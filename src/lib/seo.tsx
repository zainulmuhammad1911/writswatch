import type { Metadata } from "next";
import { getSiteSettings, type SiteSettings } from "@/lib/content";
import { CATEGORY_LABELS } from "@/lib/fixtures";
import type { Article, Timepiece } from "@/types";
import { primaryImage } from "@/types";

/**
 * Metadata and structured data.
 *
 * Two rules hold everywhere in here. Descriptions come from the record, never
 * from a template with the record's name dropped into it, because a search
 * result that reads "Rolex Submariner — a timepiece from the collection" tells
 * a reader nothing they could not see in the title. And structured data only
 * ever states what the database actually holds: no invented dates, no
 * placeholder authors, no prices on objects that are not for sale.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
  "https://indonesiawristwatchmuseum.com";

/** Absolute URL for a site-relative path. Structured data cannot use `/about`. */
export function absolute(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

/** Trims a description to something a search result will not cut mid-word. */
export function clamp(text: string | undefined, max = 160): string | undefined {
  if (!text) return undefined;
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * The per-page metadata every public route shares: a canonical URL and an
 * Open Graph block that agrees with it.
 *
 * Canonicals are given as paths. `metadataBase` in the root layout makes them
 * absolute, so the production host is configured in one place.
 *
 * The share image is resolved here rather than left to the parent, because
 * Next merges metadata one field at a time: a page that returns its own
 * `openGraph` block replaces the layout's outright, and the first version of
 * this shipped every page with no `og:image` at all for exactly that reason.
 * A page with a photograph of its own uses it; everything else falls back to
 * the editor's default from Settings, then to the generated card.
 */
export async function pageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
}: {
  title?: string;
  description?: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
}): Promise<Metadata> {
  const settings = await getSiteSettings();
  const share = image || settings.ogImage || "/opengraph-image";
  const images = [{ url: absolute(share), alt: imageAlt ?? title ?? "" }];
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: path },
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      url: path,
      type,
      images,
    },
    twitter: {
      card: "summary_large_image",
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      images: images.map((entry) => entry.url),
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Renders one structured-data block.
 *
 * `type="application/ld+json"` is data, not code: browsers never execute it,
 * which is why this is not the `dangerouslySetInnerHTML` the journal body
 * deliberately avoids. The value is still serialised through `JSON.stringify`
 * and has its `<` escaped, so a headline containing `</script>` cannot close
 * the tag early.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

function organisation(settings: SiteSettings) {
  return {
    "@type": "Museum",
    "@id": `${SITE_URL}/#museum`,
    name: settings.title,
    url: SITE_URL,
  };
}

/**
 * The museum itself, emitted once on the homepage.
 *
 * `Museum` rather than `Organization`: it is the more specific type, and it
 * carries the collection relationship. There is deliberately no `address` or
 * `openingHours` — the about page says plainly that there is no building, and
 * structured data that implies one would be a lie told to a search engine.
 */
export function museumJsonLd(
  settings: SiteSettings,
  counts: { timepieces: number }
) {
  const sameAs = [settings.instagram, settings.youtube, settings.x].filter(
    (url) => url && url.startsWith("http")
  );
  return {
    "@context": "https://schema.org",
    "@type": "Museum",
    "@id": `${SITE_URL}/#museum`,
    name: settings.title,
    alternateName: "IWM",
    url: SITE_URL,
    description: settings.description,
    slogan: settings.tagline,
    ...(settings.email ? { email: settings.email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    // An online-only museum. Saying so is more useful than omitting it.
    publicAccess: true,
    isAccessibleForFree: true,
    collection: {
      "@type": "Collection",
      "@id": `${SITE_URL}/collection#collection`,
      name: "The Collection",
      url: absolute("/collection"),
      collectionSize: counts.timepieces,
    },
  };
}

/** The collection listing, as a page holding an ordered list of its entries. */
export function collectionJsonLd({
  headline,
  description,
  timepieces,
}: {
  headline: string;
  description: string;
  timepieces: Timepiece[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/collection#page`,
    url: absolute("/collection"),
    name: headline,
    description,
    isPartOf: { "@id": `${SITE_URL}/#museum` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: timepieces.length,
      itemListElement: timepieces.map((timepiece, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absolute(`/collection/${timepiece.slug}`),
        name: `${timepiece.brand} ${timepiece.model}`,
      })),
    },
  };
}

/**
 * One timepiece.
 *
 * Typed as a `CreativeWork` and not a `Product`. Nothing here is for sale, and
 * `Product` invites the price, availability, and review fields that would have
 * to be either omitted or fabricated. `creator` is the manufacturer, and
 * `dateCreated` is only emitted when the record has a year.
 */
export function timepieceJsonLd(timepiece: Timepiece, settings: SiteSettings) {
  const name = `${timepiece.brand} ${timepiece.model}`;
  const image = primaryImage(timepiece);
  const specs = [
    { name: "Reference", value: timepiece.referenceNumber },
    { name: "Movement", value: timepiece.movement },
    { name: "Case size", value: timepiece.caseSize },
    { name: "Case material", value: timepiece.caseMaterial },
    { name: "Dial", value: timepiece.dialColor },
  ].filter((spec): spec is { name: string; value: string } =>
    Boolean(spec.value)
  );

  return {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    url: absolute(`/collection/${timepiece.slug}`),
    isPartOf: { "@id": `${SITE_URL}/#museum` },
    mainEntity: {
      "@type": "CreativeWork",
      name,
      ...(timepiece.description ? { description: timepiece.description } : {}),
      creator: { "@type": "Organization", name: timepiece.brand },
      ...(timepiece.year ? { dateCreated: String(timepiece.year) } : {}),
      ...(timepiece.category ? { genre: timepiece.category } : {}),
      ...(image ? { image: absolute(image.src) } : {}),
      ...(timepiece.referenceNumber
        ? { identifier: timepiece.referenceNumber }
        : {}),
      ...(specs.length
        ? {
            additionalProperty: specs.map((spec) => ({
              "@type": "PropertyValue",
              name: spec.name,
              value: spec.value,
            })),
          }
        : {}),
      isPartOf: { "@id": `${SITE_URL}/collection#collection` },
      ...(settings.title
        ? { holdingArchive: organisation(settings) }
        : {}),
    },
  };
}

/**
 * One journal article.
 *
 * The museum is credited as the author. The articles are unsigned on the site
 * itself, so inventing a byline for the sake of a richer result would put a
 * name in Google's index that appears nowhere in the writing.
 */
export function articleJsonLd(article: Article, settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    url: absolute(`/journal/${article.slug}`),
    headline: article.title,
    ...(article.subtitle ? { alternativeHeadline: article.subtitle } : {}),
    ...(article.excerpt ? { description: article.excerpt } : {}),
    articleSection: CATEGORY_LABELS[article.category],
    datePublished: article.publishedAt,
    inLanguage: "en",
    ...(article.coverImage ? { image: absolute(article.coverImage) } : {}),
    author: organisation(settings),
    publisher: organisation(settings),
    isPartOf: { "@id": `${SITE_URL}/#museum` },
    mainEntityOfPage: absolute(`/journal/${article.slug}`),
  };
}

/** A trail of `{ name, path }`, root first. The last entry is the current page. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}
