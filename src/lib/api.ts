import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Every endpoint answers in this shape, success or failure. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  /** Field-level messages, only on validation failures. */
  issues?: Record<string, string[]>;
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status });
}

export function fail(error: string, status = 400, issues?: Record<string, string[]>) {
  return NextResponse.json<ApiResponse<never>>(
    { success: false, error, ...(issues ? { issues } : {}) },
    { status }
  );
}

/**
 * Thrown deliberately by handlers to produce a specific status. Anything else
 * that escapes a handler is treated as unexpected and reported as a 500 with
 * no detail.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function zodIssues(error: ZodError): Record<string, string[]> {
  const issues: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (issues[key] ??= []).push(issue.message);
  }
  return issues;
}

/**
 * Wraps a handler so no route has to repeat the same try/catch.
 *
 * Client mistakes get a specific status and message. Server faults get a 500
 * and a generic message, with the detail logged rather than returned: a stack
 * trace or a raw Postgres error in an HTTP body tells an attacker about the
 * schema.
 */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return fail("Validation failed", 422, zodIssues(error));
      }
      if (error instanceof ApiError) {
        return fail(error.message, error.status);
      }
      const prismaCode = prismaErrorCode(error);
      if (prismaCode === "P2002") {
        return fail(`That ${uniqueFieldOf(error)} is already taken`, 409);
      }
      if (prismaCode === "P2025") {
        return fail("Not found", 404);
      }
      if (prismaCode === "P2003") {
        return fail("Referenced record does not exist", 409);
      }
      if (
        error instanceof Error &&
        error.message.startsWith("DATABASE_URL is not set")
      ) {
        return fail(error.message, 503);
      }
      console.error("[api] unhandled error", error);
      return fail("Something went wrong", 500);
    }
  };
}

/**
 * Prisma's error code, or null.
 *
 * Matched by shape rather than `instanceof`. The generated client lives at
 * src/generated/prisma and constructs its errors inside its own runtime
 * bundle, so an `instanceof Prisma.PrismaClientKnownRequestError` check
 * against the imported class silently returns false and every unique-key
 * violation reports as a 500. The `Pxxxx` codes are part of Prisma's public
 * contract, so reading them is both stabler and version-proof.
 */
function prismaErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && /^P\d{4}$/.test(code) ? code : null;
}

/**
 * The column named in a P2002, for a message worth reading.
 *
 * Two shapes to cover. Prisma's own engine reports `meta.target`; the pg
 * driver adapter used here reports nothing there and instead nests the
 * constraint name under meta.driverAdapterError.cause.constraint.index, e.g.
 * "Timepiece_slug_key".
 */
function uniqueFieldOf(error: unknown): string {
  const meta = (error as { meta?: Record<string, unknown> }).meta;
  if (!meta) return "value";

  const target = meta.target;
  if (Array.isArray(target)) return target.join(", ");
  if (typeof target === "string") return constraintToField(target);

  const cause = (
    meta.driverAdapterError as { cause?: { constraint?: Record<string, unknown> } }
  )?.cause;
  const constraint = cause?.constraint;
  if (constraint) {
    const fields = constraint.fields;
    if (Array.isArray(fields)) return fields.join(", ");
    if (typeof constraint.index === "string") {
      return constraintToField(constraint.index);
    }
  }
  return "value";
}

/** "Timepiece_slug_key" -> "slug". Anything unexpected passes through. */
function constraintToField(constraint: string): string {
  const match = constraint.match(/^[A-Za-z]+_(.+)_key$/);
  return match ? match[1] : constraint;
}

/**
 * Gate for every write endpoint, and a placeholder for Fase 8.
 *
 * There is no login yet, so without a check the API would let anyone create,
 * edit and delete museum records. Until NextAuth lands, writes need
 * `Authorization: Bearer $ADMIN_API_KEY`. If the variable is unset the route
 * refuses outright rather than allowing the request, so an unconfigured
 * deployment fails closed.
 */
export function requireWriteAccess(request: Request): void {
  const expected = process.env.ADMIN_API_KEY?.trim();

  if (!expected) {
    throw new ApiError(
      "Write access is not configured. Set ADMIN_API_KEY to enable it.",
      503
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token || !timingSafeEqual(token, expected)) {
    throw new ApiError("Unauthorized", 401);
  }
}

/** Constant-time compare, so a wrong key cannot be guessed byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Reads and parses a JSON body, with a clear message when it is malformed. */
export async function jsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError("Request body must be valid JSON", 400);
  }
}

/** Clamps pagination so a client cannot ask for the whole table at once. */
export function pagination(url: URL, defaultTake = 50, maxTake = 100) {
  const take = Math.min(
    Math.max(Number(url.searchParams.get("take")) || defaultTake, 1),
    maxTake
  );
  const skip = Math.max(Number(url.searchParams.get("skip")) || 0, 0);
  return { take, skip };
}
