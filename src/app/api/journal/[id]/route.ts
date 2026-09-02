import type { NextRequest } from "next/server";
import { ApiError, handler, jsonBody, ok, requireWriteAccess } from "@/lib/api";
import { requireDb } from "@/lib/db";
import { updateArticleSchema } from "@/lib/validation";

/**
 * GET    /api/journal/[id]  one article, by id or slug
 * PUT    /api/journal/[id]  update
 * DELETE /api/journal/[id]  remove
 */

async function findOr404(
  db: ReturnType<typeof requireDb>,
  identifier: string
) {
  const row = await db.article.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
    include: {
      author: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  });
  if (!row) throw new ApiError("Article not found", 404);
  return row;
}

export const GET = handler(
  async (_request: NextRequest, ctx: RouteContext<"/api/journal/[id]">) => {
    const db = requireDb();
    const { id } = await ctx.params;
    return ok(await findOr404(db, id));
  }
);

export const PUT = handler(
  async (request: NextRequest, ctx: RouteContext<"/api/journal/[id]">) => {
    requireWriteAccess(request);
    const db = requireDb();
    const { id } = await ctx.params;
    const existing = await findOr404(db, id);

    const { tags, authorId, ...fields } = updateArticleSchema.parse(
      await jsonBody(request)
    );

    const updated = await db.$transaction(async (tx) => {
      if (tags) {
        await tx.articleTag.deleteMany({ where: { articleId: existing.id } });
        for (const name of tags) {
          const tag = await tx.tag.upsert({
            where: { name },
            update: {},
            create: { name, slug: slugify(name) },
          });
          await tx.articleTag.create({
            data: { articleId: existing.id, tagId: tag.id },
          });
        }
      }

      return tx.article.update({
        where: { id: existing.id },
        data: {
          ...fields,
          ...(authorId ? { authorId } : {}),
          // Going from draft to published without an explicit date stamps now,
          // so the piece sorts into the journal in the right place.
          ...(fields.published && !existing.publishedAt && !fields.publishedAt
            ? { publishedAt: new Date() }
            : {}),
        },
        include: {
          author: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
      });
    });

    return ok(updated);
  }
);

export const DELETE = handler(
  async (request: NextRequest, ctx: RouteContext<"/api/journal/[id]">) => {
    requireWriteAccess(request);
    const db = requireDb();
    const { id } = await ctx.params;
    const existing = await findOr404(db, id);

    await db.article.delete({ where: { id: existing.id } });

    return ok({ id: existing.id, slug: existing.slug, deleted: true });
  }
);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
