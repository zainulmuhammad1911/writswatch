import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Editable copy, read from the PageContent and SiteSetting tables.
 *
 * The dashboard writes copy as flat `(page, section, key)` rows, because that
 * is the shape a generic editor can render without knowing anything about the
 * page it is editing. The pages want nested objects. This module is the seam:
 * rows in, tree out, merged over the static defaults in `content/` and
 * `lib/fixtures.ts`.
 *
 * Merging rather than replacing matters. An editor who has never touched the
 * journal hero should still get a journal hero, and a key the seed never
 * created (an image's alt text, say) must not come back undefined and blank
 * out an attribute. The defaults are the floor; the database only ever
 * overrides what it actually holds.
 */

/**
 * The defaults are `as const` object literals, which types a headline as its
 * own text and a two-paragraph body as a two-element tuple. Once the database
 * can override either, both are wrong: the value is a string of unknown
 * content and the array is of unknown length. This widens the default's shape
 * back to what an editor can actually produce.
 */
export type Editable<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Editable<U>[]
    : T extends object
      ? { -readonly [K in keyof T]: Editable<T[K]> }
      : T;

type Node = { [key: string]: Node | string };

/** Writes `body.0` into `{ body: { "0": value } }`, creating levels as needed. */
function insert(root: Node, path: string[], value: string): void {
  let cursor = root;
  for (const segment of path.slice(0, -1)) {
    const existing = cursor[segment];
    // A row whose key collides with a deeper row's prefix (`body` and
    // `body.0` both present) would otherwise throw. The deeper row wins,
    // because a scalar at a branch point is unreadable either way.
    if (typeof existing !== "object" || existing === null) cursor[segment] = {};
    cursor = cursor[segment] as Node;
  }
  cursor[path[path.length - 1]!] = value;
}

/** `{ "0": a, "1": b }` becomes `[a, b]`. Anything else stays an object. */
function materialise(node: Node | string): unknown {
  if (typeof node === "string") return node;
  const keys = Object.keys(node);
  const numeric = keys.length > 0 && keys.every((k) => /^\d+$/.test(k));
  if (numeric) {
    return keys
      .map(Number)
      .sort((a, b) => a - b)
      .map((i) => materialise(node[String(i)]!));
  }
  const out: Record<string, unknown> = {};
  for (const key of keys) out[key] = materialise(node[key]!);
  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Patch wins at every leaf; objects recurse.
 *
 * Arrays are replaced wholesale rather than merged index by index. An editor
 * who deletes the fourth paragraph of a section means to have three
 * paragraphs, not three plus whatever the default's fourth used to say.
 */
export function mergeContent<T>(base: T, patch: unknown): T {
  if (patch === undefined || patch === null) return base;
  if (isPlainObject(base) && isPlainObject(patch)) {
    const out: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(patch)) {
      out[key] = key in base ? mergeContent(base[key], value) : value;
    }
    return out as T;
  }
  return patch as T;
}

/** Every row for one page, nested by section. Empty when there is no database. */
export const contentTree = cache(
  async (page: string): Promise<Record<string, unknown>> => {
    if (!db) return {};
    const rows = await db.pageContent.findMany({
      where: { page },
      select: { section: true, key: true, value: true },
    });
    const root: Node = {};
    for (const row of rows) {
      // A blank value is treated as "not set" so clearing a field in the
      // dashboard falls back to the default rather than rendering nothing.
      if (row.value.trim() === "") continue;
      insert(root, [row.section, ...row.key.split(".")], row.value);
    }
    return materialise(root) as Record<string, unknown>;
  }
);

/** The page's copy: defaults, with whatever the database holds layered on top. */
export async function contentFor<T>(
  page: string,
  base: T
): Promise<Editable<T>> {
  return mergeContent(base, await contentTree(page)) as Editable<T>;
}

/* -------------------------------------------------------------------------- */
/*  Site settings                                                             */
/* -------------------------------------------------------------------------- */

export interface SiteSettings {
  title: string;
  tagline: string;
  description: string;
  email: string;
  instagram: string;
  youtube: string;
  x: string;
  /** SEO defaults. Fall back to the site title and description when unset. */
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
}

const SETTING_DEFAULTS: SiteSettings = {
  title: "Indonesia Wristwatch Museum",
  tagline: "A Private Collection of Exceptional Timepieces",
  description:
    "A private museum built around one collection of mechanical watches, preserved and documented.",
  // Everything below is blank by design. A cleared field in Settings has to
  // mean "do not show this", and a built-in fallback would turn it into
  // "link to instagram.com instead" — a social card that goes to a platform's
  // front page is worse than no card. The title, tagline and description
  // above are the exception: a page with no name in its own <title> is not a
  // trade worth making, so those keep a value.
  email: "",
  instagram: "",
  youtube: "",
  x: "",
  seoTitle: "",
  seoDescription: "",
  ogImage: "",
};

const SETTING_KEYS: Record<string, keyof SiteSettings> = {
  "site.title": "title",
  "site.tagline": "tagline",
  "site.description": "description",
  "site.email": "email",
  "social.instagram": "instagram",
  "social.youtube": "youtube",
  "social.x": "x",
  "seo.title": "seoTitle",
  "seo.description": "seoDescription",
  "seo.ogImage": "ogImage",
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!db) return SETTING_DEFAULTS;
  const rows = await db.siteSetting.findMany({
    where: { key: { in: Object.keys(SETTING_KEYS) } },
    select: { key: true, value: true },
  });
  const settings = { ...SETTING_DEFAULTS };
  for (const row of rows) {
    const field = SETTING_KEYS[row.key];
    if (field && row.value.trim() !== "") settings[field] = row.value.trim();
  }
  return settings;
});
