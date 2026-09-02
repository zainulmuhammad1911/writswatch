import type { ManagedImage } from "@/components/admin/ImageManager";

/**
 * Shape and blank defaults for the admin forms.
 *
 * Kept out of the form components because those are `"use client"`, and a
 * server component cannot call a function exported from a client module. The
 * "new" pages need a blank value object, so it lives here instead.
 */

export interface TimepieceFormValues {
  id?: string;
  slug: string;
  brand: string;
  model: string;
  referenceNumber: string;
  year: string;
  category: string;
  movement: string;
  caseSize: string;
  caseMaterial: string;
  dialColor: string;
  description: string;
  story: string;
  published: boolean;
  featured: boolean;
  images: ManagedImage[];
}

export function emptyTimepiece(): TimepieceFormValues {
  return {
    slug: "",
    brand: "",
    model: "",
    referenceNumber: "",
    year: "",
    category: "",
    movement: "",
    caseSize: "",
    caseMaterial: "",
    dialColor: "",
    description: "",
    story: "",
    published: true,
    featured: false,
    images: [],
  };
}

export interface ArticleFormValues {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  category: "STORY" | "ARCHIVE" | "ESSAY" | "NEWS";
  excerpt: string;
  content: string;
  coverImage: string;
  coverImageAlt: string;
  tags: string;
  published: boolean;
  featured: boolean;
  /** yyyy-mm-dd, for the date input. */
  publishedAt: string;
}

export function emptyArticle(): ArticleFormValues {
  return {
    slug: "",
    title: "",
    subtitle: "",
    category: "STORY",
    excerpt: "",
    content: "",
    coverImage: "",
    coverImageAlt: "",
    tags: "",
    published: false,
    featured: false,
    publishedAt: "",
  };
}
