import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";

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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          const target = error.meta?.target;
          const field = Array.isArray(target) ? target.join(", ") : "value";
          return fail(`That ${field} is already taken`, 409);
        }
        if (error.code === "P2025") {
          return fail("Not found", 404);
        }
        if (error.code === "P2003") {
          return fail("Referenced record does not exist", 409);
        }
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
