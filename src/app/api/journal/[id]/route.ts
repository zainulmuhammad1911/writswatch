import type { NextRequest } from "next/server";
import { ApiError, guard, handler, jsonBody, ok } from "@/lib/api";
import { audit, changedFields } from "@/lib/audit";
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
  async (request: NextRequest, ctx: RouteContext<"/api/journal/[id]">) => {
    await guard(request, "journal");
    const db = requireDb();
    const { id } = await ctx.params;
    return ok(await findOr404(db, id));
  }
);

export const PUT = handler(
  async (request: NextRequest, ctx: RouteContext<"/api/journal/[id]">) => {
    const user = await guard(request, "journal");
    const db = requireDb();
    const { id } = await ctx.params;
    const existing = await findOr404(db, id);

    const { tags, authorId, ...fields } = updateArticleSchema.parse(
      await jsonBody(request)
    );

    // Reassigning authorship is a super-admin action: otherwise an editor
    // could move a piece under somebody else's name.
    if (
      authorId &&
      authorId !== existing.authorId &&
      user.role !== "SUPER_ADMIN"
    ) {
      throw new ApiError("Only a super admin can reassign an author", 403);
    }

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

    await audit({
      userId: user.id,
      action: "UPDATE",
      entity: "Article",
      entityId: existing.id,
      details: {
        slug: existing.slug,
        changed: changedFields(existing, fields),
        ...(tags ? { tagsReplaced: tags.length } : {}),
      },
      request,
    });

    return ok(updated);
  }
);

export const DELETE = handler(
  async (request: NextRequest, ctx: RouteContext<"/api/journal/[id]">) => {
    const user = await guard(request, "journal");
    const db = requireDb();
    const { id } = await ctx.params;
    const existing = await findOr404(db, id);

    await db.article.delete({ where: { id: existing.id } });

    await audit({
      userId: user.id,
      action: "DELETE",
      entity: "Article",
      entityId: existing.id,
      details: { slug: existing.slug, title: existing.title },
      request,
    });

    return ok({ id: existing.id, slug: existing.slug, deleted: true });
  }
);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
