import type { NextRequest } from "next/server";
import { ApiError, handler, jsonBody, ok, requireWriteAccess } from "@/lib/api";
import { requireDb } from "@/lib/db";
import { updateTimepieceSchema } from "@/lib/validation";

/**
 * GET    /api/collection/[id]  one timepiece, by id or slug
 * PUT    /api/collection/[id]  update
 * DELETE /api/collection/[id]  remove
 *
 * The identifier accepts either a cuid or a slug, so the dashboard can use ids
 * and a human can use the slug they see in the URL.
 */

async function findOr404(
  db: ReturnType<typeof requireDb>,
  identifier: string
) {
  const row = await db.timepiece.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!row) throw new ApiError("Timepiece not found", 404);
  return row;
}

export const GET = handler(
  async (_request: NextRequest, ctx: RouteContext<"/api/collection/[id]">) => {
    const db = requireDb();
    const { id } = await ctx.params;
    return ok(await findOr404(db, id));
  }
);

export const PUT = handler(
  async (request: NextRequest, ctx: RouteContext<"/api/collection/[id]">) => {
    requireWriteAccess(request);
    const db = requireDb();
    const { id } = await ctx.params;
    const existing = await findOr404(db, id);

    const { images, ...fields } = updateTimepieceSchema.parse(
      await jsonBody(request)
    );

    // Sending `images` replaces the whole set rather than merging, because
    // merging by url would make it impossible to reorder or remove one.
    const updated = await db.$transaction(async (tx) => {
      if (images) {
        await tx.timepieceImage.deleteMany({
          where: { timepieceId: existing.id },
        });
        if (images.length) {
          await tx.timepieceImage.createMany({
            data: images.map((image, index) => ({
              ...image,
              timepieceId: existing.id,
              isPrimary: image.isPrimary ?? index === 0,
              sortOrder: image.sortOrder ?? index,
            })),
          });
        }
      }
      return tx.timepiece.update({
        where: { id: existing.id },
        data: fields,
        include: { images: { orderBy: { sortOrder: "asc" } } },
      });
    });

    return ok(updated);
  }
);

export const DELETE = handler(
  async (request: NextRequest, ctx: RouteContext<"/api/collection/[id]">) => {
    requireWriteAccess(request);
    const db = requireDb();
    const { id } = await ctx.params;
    const existing = await findOr404(db, id);

    // Images cascade with the timepiece (onDelete: Cascade in the schema).
    await db.timepiece.delete({ where: { id: existing.id } });

    return ok({ id: existing.id, slug: existing.slug, deleted: true });
  }
);
