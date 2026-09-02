import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { guard, handler, jsonBody, ok, pagination } from "@/lib/api";
import { audit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { createUserSchema, userQuerySchema } from "@/lib/validation";

/**
 * GET  /api/users  list staff accounts
 * POST /api/users  create one
 *
 * SUPER_ADMIN only, enforced by the "users" resource in the RBAC matrix.
 * `hashedPassword` is never selected, so it cannot leak through a response.
 */

const SAFE_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { articles: true, auditLogs: true } },
} satisfies Prisma.UserSelect;

export const GET = handler(async (request: NextRequest) => {
  await guard(request, "users");
  const db = requireDb();
  const url = new URL(request.url);
  const { take, skip } = pagination(url);

  const query = userQuerySchema.parse({
    q: url.searchParams.get("q") ?? undefined,
    role: url.searchParams.get("role") ?? undefined,
    active: url.searchParams.get("active") ?? undefined,
  });

  const where: Prisma.UserWhereInput = {};
  if (query.role) where.role = query.role;
  if (query.active && query.active !== "all") {
    where.active = query.active === "true";
  }
  if (query.q) {
    where.OR = [
      { email: { contains: query.q, mode: "insensitive" } },
      { name: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      select: SAFE_FIELDS,
      orderBy: [{ role: "asc" }, { email: "asc" }],
      take,
      skip,
    }),
    db.user.count({ where }),
  ]);

  return ok({ items, total, take, skip });
});

export const POST = handler(async (request: NextRequest) => {
  const actor = await guard(request, "users");
  const input = createUserSchema.parse(await jsonBody(request));
  const db = requireDb();

  const created = await db.user.create({
    data: {
      email: input.email,
      name: input.name,
      role: input.role ?? "EDITOR",
      hashedPassword: await hashPassword(input.password),
    },
    select: SAFE_FIELDS,
  });

  await audit({
    userId: actor.id,
    action: "CREATE",
    entity: "User",
    entityId: created.id,
    // The password is never logged; `audit` would redact it anyway.
    details: { email: created.email, role: created.role },
    request,
  });

  return ok(created, 201);
});
