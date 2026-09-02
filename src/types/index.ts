/**
 * Shared domain types for the public website.
 *
 * These describe the shape of the mock data in `lib/data.ts` and are the
 * contract the CMS API must satisfy from Fase 7 onward. Keep them in step with
 * the Prisma schema when the database lands.
 */

export interface TimepieceImage {
  src: string;
  alt?: string;
  isPrimary: boolean;
}

export interface Timepiece {
  id: string;
  slug: string;
  brand: string;
  model: string;
  referenceNumber?: string;
  year?: number;
  movement?: string;
  caseSize?: string;
  caseMaterial?: string;
  dialColor?: string;
  /** One or two sentences. Used in listings and as the meta description. */
  description?: string;
  /** Long-form prose for the detail page. */
  story?: string;
  category?: string;
  featured: boolean;
  images: TimepieceImage[];
}

export type ArticleCategory = "story" | "archive" | "essay";

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  coverImageAlt?: string;
  category: ArticleCategory;
  featured: boolean;
  /** ISO 8601 date. */
  publishedAt: string;
}

export interface ArchiveItem {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

export interface AboutSection {
  /** Anchor id, also used by the table of contents. */
  id: string;
  /** "01" through "06". */
  number: string;
  title: string;
  /** Short label for the table of contents. */
  navLabel: string;
  headline: string;
  body: string[];
  image: string;
  imageAlt: string;
  /** Optional pointer to a journal piece that goes into more depth. */
  furtherReading?: { label: string; href: string };
}

export interface PageSection {
  headline: string;
  body: string;
  image?: string;
  imageAlt?: string;
  label?: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Statistic {
  value: string;
  label: string;
}

/** Convenience: the image marked isPrimary, or the first one. */
export function primaryImage(timepiece: Timepiece): TimepieceImage | undefined {
  return timepiece.images.find((image) => image.isPrimary) ?? timepiece.images[0];
}
