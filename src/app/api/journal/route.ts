import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { ApiError, guard, handler, jsonBody, ok, pagination } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireDb } from "@/lib/db";
import { revalidateArticle } from "@/lib/revalidate";
import { articleQuerySchema, createArticleSchema } from "@/lib/validation";

/**
 * GET  /api/journal  list and filter articles
 * POST /api/journal  create one
 */

export const GET = handler(async (request: NextRequest) => {
  await guard(request, "journal");
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
  const user = await guard(request, "journal");

  const { tags, authorId, ...fields } = createArticleSchema.parse(
    await jsonBody(request)
  );

  const db = requireDb();

  // The author defaults to whoever is signed in. Only a role that can manage
  // users may attribute a piece to somebody else, or an editor could publish
  // under a colleague's name.
  let authorRecord = { id: user.id };
  if (authorId && authorId !== user.id) {
    if (user.role !== "SUPER_ADMIN") {
      throw new ApiError("Only a super admin can set another author", 403);
    }
    const other = await db.user.findUnique({ where: { id: authorId } });
    if (!other) throw new ApiError("Author not found", 409);
    authorRecord = { id: other.id };
  }
  const author = authorRecord;

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

  await audit({
    userId: user.id,
    action: "CREATE",
    entity: "Article",
    entityId: created.id,
    details: {
      slug: created.slug,
      title: created.title,
      published: created.published,
    },
    request,
  });

  revalidateArticle(created.slug);

  return ok(created, 201);
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
