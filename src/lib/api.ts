import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { actionForMethod, can, ROLE_LABELS, type Resource } from "@/lib/rbac";
import {
  hit,
  rateLimitHeaders,
  type LimitName,
  type RateLimitResult,
} from "@/lib/rate-limit";

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
      if (error instanceof RateLimitError) {
        return NextResponse.json<ApiResponse<never>>(
          { success: false, error: "Too many requests" },
          { status: 429, headers: rateLimitHeaders(error.result) }
        );
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
 * The signed-in user, or a 401.
 *
 * Middleware already refused unauthenticated requests, so reaching here
 * without a session means either the matcher missed a path or the route was
 * called from server code. Either way it is a fault, not a client error, so it
 * fails closed rather than assuming a role.
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("Unauthorized", 401);
  return { id: session.user.id, role: session.user.role, email: session.user.email ?? null };
}

export interface SessionUser {
  id: string;
  role: Role;
  email: string | null;
}

/**
 * Session plus permission plus rate limit, which is what every CMS endpoint
 * needs before it does anything.
 *
 * Order matters: identify first, then authorise, then throttle. Rate limiting
 * before authorising would let an anonymous caller burn another user's budget.
 */
export async function guard(
  request: Request,
  resource: Resource,
  options: { limit?: LimitName } = {}
): Promise<SessionUser> {
  const user = await requireSession();
  const action = actionForMethod(request.method);

  if (!can(user.role, resource, action)) {
    throw new ApiError(
      `Your role (${ROLE_LABELS[user.role]}) cannot ${action} ${resource}`,
      403
    );
  }

  // A cookie-authenticated mutation is a CSRF target. NextAuth's own token
  // covers its endpoints only, so same-origin is enforced here for everything
  // that changes state. Sec-Fetch-Site is sent by every current browser;
  // Origin is the fallback for the rest.
  if (action !== "read") {
    assertSameOrigin(request);
  }

  const limitName: LimitName = options.limit ?? "api";
  const result = hit(limitName, `${limitName}:${user.id}`);
  if (!result.ok) {
    throw new RateLimitError(result);
  }

  return user;
}

function assertSameOrigin(request: Request): void {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    throw new ApiError("Cross-site request refused", 403);
  }
  if (!site) {
    const origin = request.headers.get("origin");
    if (origin) {
      const host = request.headers.get("host");
      let originHost: string;
      try {
        originHost = new URL(origin).host;
      } catch {
        throw new ApiError("Cross-site request refused", 403);
      }
      if (!host || originHost !== host) {
        throw new ApiError("Cross-site request refused", 403);
      }
    }
  }
}

/** Carries the limit headers so the 429 tells the client when to retry. */
export class RateLimitError extends Error {
  constructor(readonly result: RateLimitResult) {
    super("Too many requests");
    this.name = "RateLimitError";
  }
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
