import { unlink } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { ApiError, guard, handler, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireDb } from "@/lib/db";

/**
 * DELETE /api/media/[id]  remove a file and its record
 */

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export const DELETE = handler(
  async (request: NextRequest, ctx: RouteContext<"/api/media/[id]">) => {
    const user = await guard(request, "media");
    const db = requireDb();
    const { id } = await ctx.params;

    const media = await db.media.findUnique({ where: { id } });
    if (!media) throw new ApiError("Media not found", 404);

    const target = path.join(
      UPLOAD_ROOT,
      media.folder ?? "",
      media.filename
    );

    // The record is the only thing that names the file, so a mismatched path
    // means something is wrong. Refuse rather than delete outside the root.
    if (!target.startsWith(UPLOAD_ROOT)) {
      throw new ApiError("Refusing to delete outside the uploads directory", 409);
    }

    // The row goes either way. A file already missing from disk should not
    // leave an undeletable record behind.
    await unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
      console.warn(`[media] file already gone: ${target}`);
    });

    await db.media.delete({ where: { id } });

    await audit({
      userId: user.id,
      action: "DELETE",
      entity: "Media",
      entityId: id,
      details: { url: media.url, filename: media.filename },
      request,
    });

    return ok({ id, deleted: true });
  }
);
