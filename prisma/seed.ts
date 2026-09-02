import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { aboutIntro, aboutSections } from "../src/content/about";
import {
  archiveItems,
  articles,
  eraOf,
  homeStats,
  pageContent,
  timepieces,
} from "../src/lib/fixtures";

/**
 * Loads the static fixtures into PostgreSQL.
 *
 * Idempotent: every write is an upsert keyed on a natural unique field, so
 * running it twice is safe and running it after hand-edits will overwrite the
 * seeded rows but leave anything else alone.
 *
 *   npx prisma db seed
 */

// The seed writes a few hundred rows in sequence, so it uses the session-mode
// pooler for the same reason migrations do.
const connectionString =
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. See README, \"The database\"."
  );
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const CATEGORY_TO_DB = {
  story: "STORY",
  archive: "ARCHIVE",
  essay: "ESSAY",
} as const;

async function seedUser() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@indonesiawristwatchmuseum.com";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  user      ${email} (already exists, password untouched)`);
    return existing;
  }

  // A random password, printed once. Seeding a known default would leave a
  // guessable admin account on anything that ever gets deployed.
  const password = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");
  const user = await db.user.create({
    data: {
      email,
      name: "Museum Admin",
      hashedPassword: await bcrypt.hash(password, 12),
      role: "SUPER_ADMIN",
    },
  });

  console.log(`  user      ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`\n  ⚠  Generated password: ${password}`);
    console.log("     Shown once. Save it now; only the hash is stored.\n");
  }
  return user;
}

async function seedTimepieces() {
  for (const [index, piece] of timepieces.entries()) {
    const { images, ...fields } = piece;
    const data = {
      slug: fields.slug,
      brand: fields.brand,
      model: fields.model,
      referenceNumber: fields.referenceNumber ?? null,
      year: fields.year ?? null,
      movement: fields.movement ?? null,
      caseSize: fields.caseSize ?? null,
      caseMaterial: fields.caseMaterial ?? null,
      dialColor: fields.dialColor ?? null,
      description: fields.description ?? null,
      story: fields.story ?? null,
      category: fields.category ?? null,
      featured: fields.featured,
      published: true,
      sortOrder: index,
    };

    const row = await db.timepiece.upsert({
      where: { slug: fields.slug },
      update: data,
      create: data,
    });

    // Replace rather than merge: the fixture is the source of truth for order
    // and for which image is primary.
    await db.timepieceImage.deleteMany({ where: { timepieceId: row.id } });
    await db.timepieceImage.createMany({
      data: images.map((image, i) => ({
        timepieceId: row.id,
        url: image.src,
        alt: image.alt ?? null,
        isPrimary: image.isPrimary,
        sortOrder: i,
      })),
    });
  }
  console.log(`  timepieces ${timepieces.length}`);
}

async function seedArticles(authorId: string) {
  for (const article of articles) {
    const data = {
      slug: article.slug,
      title: article.title,
      subtitle: article.subtitle ?? null,
      excerpt: article.excerpt ?? null,
      content: article.content,
      coverImage: article.coverImage ?? null,
      coverImageAlt: article.coverImageAlt ?? null,
      category: CATEGORY_TO_DB[article.category],
      featured: article.featured,
      published: true,
      publishedAt: new Date(`${article.publishedAt}T00:00:00Z`),
      authorId,
    };
    await db.article.upsert({
      where: { slug: article.slug },
      update: data,
      create: data,
    });
  }
  console.log(`  articles   ${articles.length}`);
}

/**
 * Flattens the static copy into (page, section, key) rows, which is what the
 * dashboard edits and what `lib/content.ts` reads back.
 *
 * Two rules about key names, because `lib/content.ts` rebuilds objects from
 * them. A dotted key nests (`body.0` becomes `body[0]`), and a section whose
 * keys are all integers becomes an array. So a list inside a section that also
 * has scalar keys must be namespaced — `items.0.title`, not `0.title` — or the
 * whole section materialises as an array and the scalars vanish.
 *
 * The rows are pruned to match: anything under a page seeded here whose
 * (section, key) is no longer produced is deleted. There is no UI for creating
 * a key, so every row's name originates in this function, and a renamed key
 * would otherwise leave its old value behind for the merge to pick up.
 */
async function seedPageContent() {
  const entries: {
    page: string;
    section: string;
    key: string;
    value: string;
    type: "TEXT" | "RICHTEXT" | "IMAGE" | "NUMBER";
  }[] = [];

  const push = (
    page: string,
    section: string,
    key: string,
    value: string,
    type: (typeof entries)[number]["type"] = "TEXT"
  ) => entries.push({ page, section, key, value, type });

  // Home
  push("home", "hero", "headline", pageContent.home.hero.headline);
  push("home", "hero", "tagline", pageContent.home.hero.tagline);
  for (const [section, block] of [
    ["about", pageContent.home.about],
    ["collection", pageContent.home.collection],
    ["featured", pageContent.home.featured],
    ["cta", pageContent.home.cta],
  ] as const) {
    for (const [key, value] of Object.entries(block)) {
      if (typeof value === "string") {
        push("home", section, key, value, key === "image" ? "IMAGE" : "TEXT");
      } else if (Array.isArray(value)) {
        value.forEach((paragraph, i) =>
          push("home", section, `${key}.${i}`, paragraph, "RICHTEXT")
        );
      }
    }
  }
  homeStats.forEach((stat, i) => {
    push("home", "stats", `${i}.value`, stat.value, "NUMBER");
    push("home", "stats", `${i}.label`, stat.label);
  });

  // Collection and journal headers
  push("collection", "header", "headline", pageContent.collection.headline);
  push("collection", "header", "description", pageContent.collection.description);
  push("journal", "header", "headline", pageContent.journal.headline);
  push("journal", "header", "subhead", pageContent.journal.subhead);
  push("journal", "header", "description", pageContent.journal.description);
  push("journal", "header", "heroImage", pageContent.journal.heroImage, "IMAGE");
  push("journal", "header", "heroImageAlt", pageContent.journal.heroImageAlt);
  push("journal", "archive", "label", pageContent.journal.archive.label);
  push(
    "journal",
    "archive",
    "description",
    pageContent.journal.archive.description
  );
  for (const [key, value] of Object.entries(pageContent.journal.cta)) {
    push("journal", "cta", key, value);
  }

  // Archive tiles. Namespaced under `items.` so the section keeps its label
  // and description alongside the list.
  archiveItems.forEach((item, i) => {
    push("journal", "archive", `items.${i}.id`, item.id);
    push("journal", "archive", `items.${i}.title`, item.title);
    push("journal", "archive", `items.${i}.description`, item.description);
    push("journal", "archive", `items.${i}.image`, item.image, "IMAGE");
    push("journal", "archive", `items.${i}.imageAlt`, item.imageAlt);
  });

  // About
  push("about", "header", "headline", aboutIntro.headline);
  push("about", "header", "lede", aboutIntro.lede);
  for (const section of aboutSections) {
    push("about", section.id, "title", section.title);
    push("about", section.id, "headline", section.headline);
    push("about", section.id, "image", section.image, "IMAGE");
    push("about", section.id, "imageAlt", section.imageAlt);
    section.body.forEach((paragraph, i) =>
      push("about", section.id, `body.${i}`, paragraph, "RICHTEXT")
    );
  }

  const pages = [...new Set(entries.map((entry) => entry.page))];
  const keep = new Set(
    entries.map((entry) => `${entry.page}/${entry.section}/${entry.key}`)
  );
  const existing = await db.pageContent.findMany({
    where: { page: { in: pages } },
    select: { id: true, page: true, section: true, key: true },
  });
  const stale = existing.filter(
    (row) => !keep.has(`${row.page}/${row.section}/${row.key}`)
  );
  if (stale.length > 0) {
    await db.pageContent.deleteMany({
      where: { id: { in: stale.map((row) => row.id) } },
    });
    console.log(`  pruned     ${stale.length} stale content rows`);
  }

  for (const entry of entries) {
    await db.pageContent.upsert({
      where: {
        page_section_key: {
          page: entry.page,
          section: entry.section,
          key: entry.key,
        },
      },
      update: { value: entry.value, type: entry.type },
      create: entry,
    });
  }
  console.log(`  pageContent ${entries.length} entries`);
}

async function seedSettings() {
  const settings = [
    { key: "site.title", value: "Indonesia Wristwatch Museum" },
    {
      key: "site.tagline",
      // Read by the Museum structured data and the generated share image.
      value: "A Private Collection of Exceptional Timepieces",
    },
    {
      key: "site.description",
      value:
        "A private museum built around one collection of mechanical watches, preserved and documented.",
    },
    { key: "site.email", value: "hello@indonesiawristwatchmuseum.com" },
    { key: "social.instagram", value: "https://instagram.com/" },
    { key: "social.youtube", value: "https://youtube.com/" },
    { key: "social.x", value: "https://x.com/" },
    { key: "collection.eras", value: JSON.stringify([...new Set(timepieces.map(eraOf))].sort()), type: "json" },
  ];

  for (const setting of settings) {
    await db.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, type: setting.type ?? "string" },
      create: { ...setting, type: setting.type ?? "string" },
    });
  }
  console.log(`  settings   ${settings.length}`);
}

async function main() {
  console.log("Seeding Indonesia Wristwatch Museum\n");
  const user = await seedUser();
  await seedTimepieces();
  await seedArticles(user.id);
  await seedPageContent();
  await seedSettings();
  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
