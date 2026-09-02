import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { guard, handler, ok, pagination } from "@/lib/api";
import { requireDb } from "@/lib/db";
import { auditQuerySchema } from "@/lib/validation";

/**
 * GET /api/audit  the audit trail, filterable
 *
 * Read only, by design. Nothing writes here except `lib/audit.ts`, and an
 * endpoint that could edit or delete audit rows would defeat their purpose.
 */

export const GET = handler(async (request: NextRequest) => {
  await guard(request, "audit");
  const db = requireDb();
  const url = new URL(request.url);
  const { take, skip } = pagination(url);

  const query = auditQuerySchema.parse({
    userId: url.searchParams.get("userId") ?? undefined,
    action: url.searchParams.get("action") ?? undefined,
    entity: url.searchParams.get("entity") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  const where: Prisma.AuditLogWhereInput = {};
  if (query.userId) where.userId = query.userId;
  if (query.action) where.action = query.action;
  if (query.entity) where.entity = query.entity;
  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from ? { gte: query.from } : {}),
      // `to` is a date, so include the whole of that day.
      ...(query.to
        ? { lte: new Date(query.to.getTime() + 24 * 60 * 60 * 1000 - 1) }
        : {}),
    };
  }

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    db.auditLog.count({ where }),
  ]);

  return ok({ items, total, take, skip });
});
