import { db, isDatabaseEnabled } from "@/lib/db";
import {
  contentFor,
  contentTree,
  mergeContent,
  type Editable,
} from "@/lib/content";
import { aboutIntro, aboutSections } from "@/content/about";
import * as fixtures from "@/lib/fixtures";
import type {
  AboutSection,
  Article,
  ArchiveItem,
  Statistic,
  Timepiece,
} from "@/types";
import type { Prisma } from "@/generated/prisma/client";
import type {
  Article as DbArticle,
  ArticleCategory as DbArticleCategory,
  Timepiece as DbTimepiece,
  TimepieceImage as DbTimepieceImage,
} from "@/generated/prisma/client";

/**
 * The one place pages read content from.
 *
 * Server components call Prisma through here rather than fetching the app's
 * own API routes over HTTP. A server component that fetches its own /api
 * endpoint pays a second network round trip, loses the ability to prerender,
 * and turns one query into two hops for no benefit. The API routes exist for
 * clients that are genuinely remote: the admin dashboard in Fase 9, and
 * anything outside this process.
 *
 * While DATABASE_URL is unset every function falls back to the static
 * fixtures, which is why the site still renders before Postgres exists. The
 * fallback is worth keeping past that point: it is what makes `next build`
 * work on a machine with no database, and it is the floor the editable copy
 * in `lib/content.ts` merges over.
 */

let warned = false;
function noteFixtureMode(): void {
  if (warned || process.env.NODE_ENV === "test") return;
  warned = true;
  console.warn(
    "[queries] DATABASE_URL is not set. Serving static fixtures. " +
      "See README, \"Setting up the database\"."
  );
}

/* -------------------------------------------------------------------------- */
/*  Row mapping                                                               */
/* -------------------------------------------------------------------------- */

type DbTimepieceWithImages = DbTimepiece & { images: DbTimepieceImage[] };

function toTimepiece(row: DbTimepieceWithImages): Timepiece {
  return {
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    referenceNumber: row.referenceNumber ?? undefined,
    year: row.year ?? undefined,
    movement: row.movement ?? undefined,
    caseSize: row.caseSize ?? undefined,
    caseMaterial: row.caseMaterial ?? undefined,
    dialColor: row.dialColor ?? undefined,
    description: row.description ?? undefined,
    story: row.story ?? undefined,
    category: row.category ?? undefined,
    featured: row.featured,
    images: row.images
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => ({
        src: image.url,
        alt: image.alt ?? undefined,
        isPrimary: image.isPrimary,
      })),
  };
}

const CATEGORY_TO_DB: Record<Article["category"], DbArticleCategory> = {
  story: "STORY",
  archive: "ARCHIVE",
  essay: "ESSAY",
};

const CATEGORY_FROM_DB: Record<DbArticleCategory, Article["category"]> = {
  STORY: "story",
  ARCHIVE: "archive",
  ESSAY: "essay",
  // The schema has a NEWS category the frontend has no design for yet. It maps
  // to "story" so an editor choosing it cannot produce an unrenderable page.
  NEWS: "story",
};

export function articleCategoryToDb(
  category: Article["category"]
): DbArticleCategory {
  return CATEGORY_TO_DB[category];
}

function toArticle(row: DbArticle): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    excerpt: row.excerpt ?? undefined,
    content: row.content,
    coverImage: row.coverImage ?? undefined,
    coverImageAlt: row.coverImageAlt ?? undefined,
    category: CATEGORY_FROM_DB[row.category],
    featured: row.featured,
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString().slice(0, 10),
  };
}

const publishedTimepiece = { published: true } as const;
const timepieceOrder = [
  { sortOrder: "asc" as const },
  { brand: "asc" as const },
  { model: "asc" as const },
];

/* -------------------------------------------------------------------------- */
/*  Timepieces                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Translates the collection page's filters into a Prisma `where` clause.
 *
 * The filtering happens in Postgres rather than in the browser. With twelve
 * timepieces either would feel instant, but the collection is described as
 * "considerably larger and still growing", and the version that keeps working
 * at three hundred entries is the one that never ships the whole table to the
 * client. It also means a filtered URL renders filtered on first paint, which
 * matters for a link somebody shares.
 */
function timepieceWhere(filters: fixtures.CollectionFilters) {
  const clauses: Prisma.TimepieceWhereInput[] = [publishedTimepiece];

  if (filters.brand) clauses.push({ brand: filters.brand });
  if (filters.type) clauses.push({ category: filters.type });

  if (filters.era) {
    const decade = /^(\d{4})s$/.exec(filters.era);
    // `eraOf` labels a missing year "Unknown", so the filter has to be able
    // to ask for exactly that.
    clauses.push(
      decade
        ? { year: { gte: Number(decade[1]), lte: Number(decade[1]) + 9 } }
        : { year: null }
    );
  }

  const query = filters.query?.trim();
  if (query) {
    const contains = { contains: query, mode: "insensitive" } as const;
    const year = /^\d{4}$/.test(query) ? Number(query) : undefined;
    clauses.push({
      OR: [
        { brand: contains },
        { model: contains },
        { referenceNumber: contains },
        { category: contains },
        ...(year === undefined ? [] : [{ year }]),
      ],
    });
  }

  return { AND: clauses };
}

export async function getTimepieces(
  filters?: fixtures.CollectionFilters
): Promise<Timepiece[]> {
  if (!db) {
    noteFixtureMode();
    return filters
      ? fixtures.filterTimepieces(fixtures.timepieces, filters)
      : [...fixtures.timepieces];
  }
  const rows = await db.timepiece.findMany({
    where: filters ? timepieceWhere(filters) : publishedTimepiece,
    include: { images: true },
    orderBy: timepieceOrder,
  });
  return rows.map(toTimepiece);
}

/** How many published timepieces there are, ignoring any filter. */
export async function countTimepieces(): Promise<number> {
  if (!db) {
    noteFixtureMode();
    return fixtures.timepieces.length;
  }
  return db.timepiece.count({ where: publishedTimepiece });
}

export async function getFeaturedTimepieces(): Promise<Timepiece[]> {
  if (!db) {
    noteFixtureMode();
    return fixtures.featuredTimepieces;
  }
  const rows = await db.timepiece.findMany({
    where: { ...publishedTimepiece, featured: true },
    include: { images: true },
    orderBy: timepieceOrder,
  });
  return rows.map(toTimepiece);
}

export async function getTimepieceBySlug(
  slug: string
): Promise<Timepiece | null> {
  if (!db) {
    noteFixtureMode();
    return fixtures.getTimepieceBySlug(slug) ?? null;
  }
  const row = await db.timepiece.findFirst({
    where: { slug, ...publishedTimepiece },
    include: { images: true },
  });
  return row ? toTimepiece(row) : null;
}

/** The entries either side of a timepiece, wrapping at both ends. */
export async function getTimepieceNeighbours(slug: string): Promise<{
  previous: Timepiece | null;
  next: Timepiece | null;
}> {
  const all = await getTimepieces();
  const index = all.findIndex((t) => t.slug === slug);
  if (index === -1) return { previous: null, next: null };
  const count = all.length;
  return {
    previous: all[(index - 1 + count) % count] ?? null,
    next: all[(index + 1) % count] ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Articles                                                                  */
/* -------------------------------------------------------------------------- */

export async function getArticles(): Promise<Article[]> {
  if (!db) {
    noteFixtureMode();
    return fixtures.articles;
  }
  const rows = await db.article.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toArticle);
}

export async function getFeaturedArticle(): Promise<Article | null> {
  const all = await getArticles();
  return all.find((a) => a.featured) ?? all[0] ?? null;
}

/** Everything except the featured piece, oldest first. */
export async function getStoryArticles(): Promise<Article[]> {
  const all = await getArticles();
  const featured = all.find((a) => a.featured) ?? all[0];
  return all.filter((a) => a.slug !== featured?.slug);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!db) {
    noteFixtureMode();
    return fixtures.getArticleBySlug(slug) ?? null;
  }
  const row = await db.article.findFirst({ where: { slug, published: true } });
  return row ? toArticle(row) : null;
}

/** Up to `limit` other articles, in reading order, wrapping past the end. */
export async function getRelatedArticles(
  slug: string,
  limit = 3
): Promise<Article[]> {
  const all = await getArticles();
  const index = all.findIndex((a) => a.slug === slug);
  if (index === -1) return all.slice(0, limit);
  return [...all.slice(index + 1), ...all.slice(0, index)].slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/*  Page content                                                              */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Editable copy                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Page copy, from the PageContent table with the fixtures as defaults.
 *
 * One function per page rather than one `pageContent` object, because each is
 * a separate query and pages should not pay for copy they do not render.
 * `contentFor` is request-cached, so a page that needs its copy twice (a
 * `generateMetadata` and the component itself) still makes one query.
 */

const homeBase = {
  ...fixtures.pageContent.home,
  stats: fixtures.homeStats,
};

export async function getHomeContent(): Promise<Editable<typeof homeBase>> {
  return contentFor("home", homeBase);
}

const collectionBase = fixtures.pageContent.collection;

export async function getCollectionContent(): Promise<{
  headline: string;
  description: string;
}> {
  return contentFor("collection", collectionBase);
}

const journalBase = {
  ...fixtures.pageContent.journal,
  archive: {
    ...fixtures.pageContent.journal.archive,
    items: fixtures.archiveItems,
  },
};

export async function getJournalContent(): Promise<Editable<typeof journalBase>> {
  return contentFor("journal", journalBase);
}

/**
 * The about page merges section by section rather than through `contentFor`,
 * because its PageContent `section` column holds the section's own id. The
 * six ids are the tree's top-level keys, so there is no single default object
 * to merge against.
 */
export async function getAboutContent(): Promise<{
  header: typeof aboutIntro;
  sections: AboutSection[];
}> {
  const tree = await contentTree("about");
  return {
    header: mergeContent(aboutIntro, tree.header),
    sections: aboutSections.map((section) =>
      mergeContent(section, tree[section.id])
    ),
  };
}

export async function getArchiveItems(): Promise<ArchiveItem[]> {
  const { archive } = await getJournalContent();
  return archive.items;
}

export async function getHomeStats(): Promise<Statistic[]> {
  const { stats } = await getHomeContent();
  return stats;
}

/* -------------------------------------------------------------------------- */
/*  Pure helpers, re-exported so pages need one import                        */
/* -------------------------------------------------------------------------- */

export {
  CATEGORY_LABELS,
  eraOf,
  filterTimepieces,
  formatArticleDate,
} from "@/lib/fixtures";
export type { CollectionFilters } from "@/lib/fixtures";

/** Filter options, derived from whatever is actually in the collection. */
export async function getCollectionFacets(): Promise<{
  brands: string[];
  eras: string[];
  types: string[];
}> {
  const all = await getTimepieces();
  const distinct = (values: string[]) => [...new Set(values)];
  return {
    brands: distinct(all.map((t) => t.brand)).sort((a, b) =>
      a.localeCompare(b)
    ),
    eras: distinct(all.map((t) => fixtures.eraOf(t))).sort(),
    types: distinct(
      all.map((t) => t.category).filter((c): c is string => Boolean(c))
    ).sort((a, b) => a.localeCompare(b)),
  };
}

export { isDatabaseEnabled };
