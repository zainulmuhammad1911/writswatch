import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { guard, handler, jsonBody, ok, pagination } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireDb } from "@/lib/db";
import { createTimepieceSchema, timepieceQuerySchema } from "@/lib/validation";

/**
 * GET  /api/collection  list, filter and search timepieces
 * POST /api/collection  create one
 */

/** "1960s" -> the year range it covers. */
function eraRange(era: string): { gte: number; lte: number } {
  const decade = Number(era.slice(0, 4));
  return { gte: decade, lte: decade + 9 };
}

export const GET = handler(async (request: NextRequest) => {
  await guard(request, "collection");
  const db = requireDb();
  const url = new URL(request.url);
  const { take, skip } = pagination(url);

  const query = timepieceQuerySchema.parse({
    q: url.searchParams.get("q") ?? undefined,
    brand: url.searchParams.get("brand") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    era: url.searchParams.get("era") ?? undefined,
    featured: url.searchParams.get("featured") ?? undefined,
    published: url.searchParams.get("published") ?? undefined,
  });

  const where: Prisma.TimepieceWhereInput = {};

  // Unpublished records are private by default. Asking for them is allowed but
  // has to be explicit, and the dashboard is the only thing that will.
  if (query.published !== "all") {
    where.published = query.published !== "false";
  }
  if (query.brand) where.brand = query.brand;
  if (query.category) where.category = query.category;
  if (query.featured) where.featured = query.featured === "true";
  if (query.era) where.year = eraRange(query.era);

  if (query.q) {
    const q = query.q;
    where.OR = [
      { brand: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { referenceNumber: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.timepiece.findMany({
      where,
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { brand: "asc" }, { model: "asc" }],
      take,
      skip,
    }),
    db.timepiece.count({ where }),
  ]);

  return ok({ items, total, take, skip });
});

export const POST = handler(async (request: NextRequest) => {
  const user = await guard(request, "collection");

  // Validate before reaching for the database. A malformed payload is the
  // client's problem and is worth reporting even when the database is down.
  const { images, ...fields } = createTimepieceSchema.parse(
    await jsonBody(request)
  );

  const db = requireDb();

  const created = await db.timepiece.create({
    data: {
      ...fields,
      images: images?.length
        ? {
            create: images.map((image, index) => ({
              ...image,
              // Whatever the client sends, exactly one image is primary: the
              // one it marked, or the first.
              isPrimary: image.isPrimary ?? index === 0,
              sortOrder: image.sortOrder ?? index,
            })),
          }
        : undefined,
    },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  await audit({
    userId: user.id,
    action: "CREATE",
    entity: "Timepiece",
    entityId: created.id,
    details: { slug: created.slug, brand: created.brand, model: created.model },
    request,
  });

  return ok(created, 201);
});
