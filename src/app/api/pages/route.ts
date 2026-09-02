import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { guard, handler, jsonBody, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireDb } from "@/lib/db";
import { pageQuerySchema, updatePageContentSchema } from "@/lib/validation";

/**
 * GET /api/pages?page=home[&section=hero]  editable copy for a page
 * PUT /api/pages                           upsert one entry or a batch
 *
 * Rows are keyed on (page, section, key), which is unique in the schema, so a
 * PUT is an upsert: the dashboard does not have to know whether an editor has
 * touched a given field before.
 */

export const GET = handler(async (request: NextRequest) => {
  await guard(request, "pages");
  const db = requireDb();
  const url = new URL(request.url);

  const query = pageQuerySchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    section: url.searchParams.get("section") ?? undefined,
  });

  const where: Prisma.PageContentWhereInput = { page: query.page };
  if (query.section) where.section = query.section;

  const rows = await db.pageContent.findMany({
    where,
    orderBy: [{ section: "asc" }, { key: "asc" }],
  });

  // Also return it grouped, because a consumer almost always wants
  // content.hero.headline rather than a flat array to search through.
  const grouped: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    (grouped[row.section] ??= {})[row.key] = row.value;
  }

  return ok({ page: query.page, entries: rows, grouped });
});

export const PUT = handler(async (request: NextRequest) => {
  const user = await guard(request, "pages");

  const parsed = updatePageContentSchema.parse(await jsonBody(request));
  const entries = "entries" in parsed ? parsed.entries : [parsed];

  const db = requireDb();

  // One transaction, so a partly-applied batch cannot leave a page with half
  // its copy updated.
  const saved = await db.$transaction(
    entries.map((entry) =>
      db.pageContent.upsert({
        where: {
          page_section_key: {
            page: entry.page,
            section: entry.section,
            key: entry.key,
          },
        },
        update: { value: entry.value, ...(entry.type ? { type: entry.type } : {}) },
        create: {
          page: entry.page,
          section: entry.section,
          key: entry.key,
          value: entry.value,
          ...(entry.type ? { type: entry.type } : {}),
        },
      })
    )
  );

  await audit({
    userId: user.id,
    action: "UPDATE",
    entity: "PageContent",
    details: {
      count: saved.length,
      keys: entries.map((e) => `${e.page}.${e.section}.${e.key}`),
    },
    request,
  });

  return ok({ updated: saved.length, entries: saved });
});
