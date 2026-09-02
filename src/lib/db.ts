import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma client, or null when no database is configured yet.
 *
 * `DATABASE_URL` being unset is treated as an explicit "not provisioned"
 * state rather than an error, so the site keeps rendering from the static
 * fixtures while the database is being set up. Every read goes through
 * `lib/queries.ts`, which is the only place that decides between the two.
 *
 * This is a Fase 7 bridge. Once a database exists, delete `isDatabaseEnabled`
 * and the fixture branch in queries.ts and let a missing URL fail loudly.
 */

const connectionString = process.env.DATABASE_URL?.trim();

export const isDatabaseEnabled = Boolean(connectionString);

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

// Next.js reloads modules on every edit in development. Without the global
// the dev server would open a new connection pool per reload and exhaust
// Postgres' connection limit within a few minutes.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db: PrismaClient | null = isDatabaseEnabled
  ? (globalForPrisma.prisma ??= createClient())
  : null;

if (process.env.NODE_ENV !== "production" && isDatabaseEnabled) {
  globalForPrisma.prisma = db ?? undefined;
}

/**
 * The client, or a thrown error. Use in API routes, which have no sensible
 * fixture fallback: an endpoint that silently returns mock data would be
 * worse than one that says the database is missing.
 */
export function requireDb(): PrismaClient {
  if (!db) {
    throw new Error(
      "DATABASE_URL is not set. See README, \"Setting up the database\"."
    );
  }
  return db;
}
