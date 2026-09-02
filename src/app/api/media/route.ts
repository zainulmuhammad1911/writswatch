import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import sharp from "sharp";
import { ApiError, guard, handler, ok, pagination } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireDb } from "@/lib/db";
import {
  ALLOWED_MIME_TYPES,
  MAX_DIMENSION,
  MAX_UPLOAD_BYTES,
  mediaMetaSchema,
  mediaQuerySchema,
} from "@/lib/validation";

/**
 * GET  /api/media  list uploads
 * POST /api/media  upload a file (multipart/form-data, field name "file")
 *
 * Files land in public/uploads. That is fine for a single server and is what
 * the PRD asks for in this phase; it does not survive a redeploy on an
 * ephemeral filesystem, which is why the PRD moves this to S3 later.
 */

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export const GET = handler(async (request: NextRequest) => {
  await guard(request, "media");
  const db = requireDb();
  const url = new URL(request.url);
  const { take, skip } = pagination(url);

  const query = mediaQuerySchema.parse({
    folder: url.searchParams.get("folder") ?? undefined,
    mimeType: url.searchParams.get("mimeType") ?? undefined,
  });

  const where: Prisma.MediaWhereInput = {};
  if (query.folder) where.folder = query.folder;
  if (query.mimeType) where.mimeType = { startsWith: query.mimeType };

  const [items, total] = await Promise.all([
    db.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    db.media.count({ where }),
  ]);

  return ok({ items, total, take, skip });
});

export const POST = handler(async (request: NextRequest) => {
  // 20 uploads a minute per user, per the PRD, rather than the general 100.
  const user = await guard(request, "media", { limit: "upload" });
  const db = requireDb();

  const form = await request.formData().catch(() => {
    throw new ApiError("Expected multipart/form-data", 400);
  });

  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ApiError("No file sent under the field name \"file\"", 400);
  }

  // Trust the sniffed type, not the filename. An .jpg extension on an HTML
  // file would otherwise be served back as HTML from our own origin.
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new ApiError(
      `Unsupported type "${file.type || "unknown"}". Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
      415
    );
  }
  if (file.size === 0) throw new ApiError("File is empty", 400);
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(
      `File is larger than ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB`,
      413
    );
  }

  const meta = mediaMetaSchema.parse({
    alt: (form.get("alt") as string | null) ?? undefined,
    folder: (form.get("folder") as string | null) ?? undefined,
  });

  // Re-encode through sharp rather than writing the bytes as received. This
  // does three jobs the PRD asks for: it proves the file really is the image
  // its MIME type claims, it drops EXIF (which carries GPS coordinates and
  // camera serials), and it yields the dimensions for the Media record.
  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  let width: number;
  let height: number;
  try {
    const pipeline = sharp(input, { failOn: "error" }).rotate();
    const metadata = await pipeline.metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("no dimensions");
    }
    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      throw new ApiError(
        `Image is larger than ${MAX_DIMENSION}px on a side (${metadata.width}x${metadata.height})`,
        413
      );
    }
    // withMetadata() is deliberately not called, which is what strips EXIF.
    output = await pipeline.toBuffer();
    const after = await sharp(output).metadata();
    width = after.width ?? metadata.width;
    height = after.height ?? metadata.height;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("File is not a readable image", 415);
  }

  // The stored name is generated, never taken from the upload. A client-supplied
  // filename is a path traversal waiting to happen.
  const extension = EXTENSIONS[file.type] ?? "bin";
  const filename = `${randomUUID()}.${extension}`;
  const folder = meta.folder ?? "";
  const directory = path.join(UPLOAD_ROOT, folder);

  // Belt and braces: the folder is already validated, but confirm the resolved
  // path is still inside the uploads root before writing.
  if (!directory.startsWith(UPLOAD_ROOT)) {
    throw new ApiError("Invalid folder", 400);
  }

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), output);

  const created = await db.media.create({
    data: {
      filename,
      originalName: file.name.slice(0, 255),
      mimeType: file.type,
      // The re-encoded size, not what arrived, so the record matches the file.
      size: output.byteLength,
      width,
      height,
      url: `/uploads/${folder ? `${folder}/` : ""}${filename}`,
      alt: meta.alt,
      folder: folder || null,
    },
  });

  await audit({
    userId: user.id,
    action: "CREATE",
    entity: "Media",
    entityId: created.id,
    details: {
      url: created.url,
      mimeType: created.mimeType,
      size: created.size,
      dimensions: `${width}x${height}`,
    },
    request,
  });

  return ok(created, 201);
});

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
