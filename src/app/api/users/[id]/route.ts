import type { NextRequest } from "next/server";
import { ApiError, guard, handler, jsonBody, ok } from "@/lib/api";
import { audit, changedFields } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { updateUserSchema } from "@/lib/validation";

/**
 * GET    /api/users/[id]  one account
 * PUT    /api/users/[id]  change name, role, active state, or password
 * DELETE /api/users/[id]  remove, only if the account owns no history
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
} as const;

export const GET = handler(
  async (request: NextRequest, ctx: RouteContext<"/api/users/[id]">) => {
    await guard(request, "users");
    const db = requireDb();
    const { id } = await ctx.params;
    const user = await db.user.findUnique({ where: { id }, select: SAFE_FIELDS });
    if (!user) throw new ApiError("User not found", 404);
    return ok(user);
  }
);

export const PUT = handler(
  async (request: NextRequest, ctx: RouteContext<"/api/users/[id]">) => {
    const actor = await guard(request, "users");
    const input = updateUserSchema.parse(await jsonBody(request));
    const db = requireDb();
    const { id } = await ctx.params;

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) throw new ApiError("User not found", 404);

    // Two ways to lock yourself out, both refused: demoting your own account
    // out of SUPER_ADMIN, and deactivating it. Either would leave the museum
    // with no way back in if this is the only super admin.
    const isSelf = existing.id === actor.id;
    if (isSelf && input.role && input.role !== existing.role) {
      throw new ApiError("You cannot change your own role", 409);
    }
    if (isSelf && input.active === false) {
      throw new ApiError("You cannot deactivate your own account", 409);
    }

    // And the same protection for the last remaining super admin, whoever
    // is doing it.
    if (
      existing.role === "SUPER_ADMIN" &&
      (input.active === false || (input.role && input.role !== "SUPER_ADMIN"))
    ) {
      const others = await db.user.count({
        where: { role: "SUPER_ADMIN", active: true, id: { not: existing.id } },
      });
      if (others === 0) {
        throw new ApiError(
          "This is the only active super admin. Promote another account first.",
          409
        );
      }
    }

    const { password, ...fields } = input;

    const updated = await db.user.update({
      where: { id },
      data: {
        ...fields,
        ...(password ? { hashedPassword: await hashPassword(password) } : {}),
      },
      select: SAFE_FIELDS,
    });

    await audit({
      userId: actor.id,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      details: {
        email: existing.email,
        changed: changedFields(existing, fields),
        ...(password ? { passwordReset: true } : {}),
      },
      request,
    });

    return ok(updated);
  }
);

export const DELETE = handler(
  async (request: NextRequest, ctx: RouteContext<"/api/users/[id]">) => {
    const actor = await guard(request, "users");
    const db = requireDb();
    const { id } = await ctx.params;

    if (id === actor.id) {
      throw new ApiError("You cannot delete your own account", 409);
    }

    const existing = await db.user.findUnique({
      where: { id },
      include: { _count: { select: { articles: true, auditLogs: true } } },
    });
    if (!existing) throw new ApiError("User not found", 404);

    // Articles and audit rows both hold a required author/user reference, so a
    // hard delete would either fail or take the history with it. Deactivating
    // is the answer, and the message says so rather than just refusing.
    const { articles, auditLogs } = existing._count;
    if (articles > 0 || auditLogs > 0) {
      throw new ApiError(
        `This account owns ${articles} article(s) and ${auditLogs} audit record(s), which would be lost. Deactivate it instead.`,
        409
      );
    }

    await db.user.delete({ where: { id } });

    await audit({
      userId: actor.id,
      action: "DELETE",
      entity: "User",
      entityId: id,
      details: { email: existing.email, role: existing.role },
      request,
    });

    return ok({ id, deleted: true });
  }
);
