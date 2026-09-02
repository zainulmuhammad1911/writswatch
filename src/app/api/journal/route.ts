import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import {
  ApiError,
  handler,
  jsonBody,
  ok,
  pagination,
  requireWriteAccess,
} from "@/lib/api";
import { requireDb } from "@/lib/db";
import { articleQuerySchema, createArticleSchema } from "@/lib/validation";

/**
 * GET  /api/journal  list and filter articles
 * POST /api/journal  create one
 */

export const GET = handler(async (request: NextRequest) => {
  const db = requireDb();
  const url = new URL(request.url);
  const { take, skip } = pagination(url);

  const query = articleQuerySchema.parse({
    q: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    featured: url.searchParams.get("featured") ?? undefined,
    published: url.searchParams.get("published") ?? undefined,
  });

  const where: Prisma.ArticleWhereInput = {};
  if (query.published !== "all") {
    where.published = query.published !== "false";
  }
  if (query.category) where.category = query.category;
  if (query.featured) where.featured = query.featured === "true";
  if (query.q) {
    const q = query.q;
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take,
      skip,
    }),
    db.article.count({ where }),
  ]);

  return ok({ items, total, take, skip });
});

export const POST = handler(async (request: NextRequest) => {
  requireWriteAccess(request);

  const { tags, authorId, ...fields } = createArticleSchema.parse(
    await jsonBody(request)
  );

  const db = requireDb();

  // Article.authorId is required by the schema. There is no session to read it
  // from until Fase 8, so fall back to the oldest user, which the seed creates.
  const author = authorId
    ? await db.user.findUnique({ where: { id: authorId } })
    : await db.user.findFirst({ orderBy: { createdAt: "asc" } });

  if (!author) {
    throw new ApiError(
      "No author available. Seed the database or pass authorId.",
      409
    );
  }

  const created = await db.article.create({
    data: {
      ...fields,
      authorId: author.id,
      // Publishing without a date would sort the piece to the bottom forever.
      publishedAt:
        fields.publishedAt ?? (fields.published ? new Date() : null),
      tags: tags?.length
        ? {
            create: tags.map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { name },
                  create: { name, slug: slugify(name) },
                },
              },
            })),
          }
        : undefined,
    },
    include: { tags: { include: { tag: true } } },
  });

  return ok(created, 201);
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
