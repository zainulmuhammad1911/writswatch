import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI configuration.
 *
 * From Prisma 7 the connection string lives here rather than in
 * schema.prisma. The runtime client gets it separately, through the pg driver
 * adapter in src/lib/db.ts.
 *
 * Migrations use DIRECT_URL when it is set. On Supabase, DATABASE_URL points at
 * the transaction-mode pooler on port 6543, which cannot run a migration: it
 * hands out a different backend per statement, so the advisory lock Prisma
 * takes for the duration of a migration would be dropped immediately. Port
 * 5432 is the session-mode pooler, which holds one backend for the connection.
 *
 * A local Postgres needs neither, so DIRECT_URL falls back to DATABASE_URL.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL || "",
  },
});
