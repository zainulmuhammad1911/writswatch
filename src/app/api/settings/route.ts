import type { NextRequest } from "next/server";
import { handler, jsonBody, ok, requireWriteAccess } from "@/lib/api";
import { requireDb } from "@/lib/db";
import { updateSettingsSchema } from "@/lib/validation";

/**
 * GET /api/settings  every site setting
 * PUT /api/settings  upsert one or many
 */

export const GET = handler(async () => {
  const db = requireDb();
  const rows = await db.siteSetting.findMany({ orderBy: { key: "asc" } });

  // Keyed as well as listed. Callers want settings.values["site.title"].
  const values: Record<string, string> = {};
  for (const row of rows) values[row.key] = row.value;

  return ok({ settings: rows, values });
});

export const PUT = handler(async (request: NextRequest) => {
  requireWriteAccess(request);

  const parsed = updateSettingsSchema.parse(await jsonBody(request));
  const settings = "settings" in parsed ? parsed.settings : [parsed];

  const db = requireDb();

  const saved = await db.$transaction(
    settings.map((setting) =>
      db.siteSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          ...(setting.type ? { type: setting.type } : {}),
        },
        create: {
          key: setting.key,
          value: setting.value,
          ...(setting.type ? { type: setting.type } : {}),
        },
      })
    )
  );

  return ok({ updated: saved.length, settings: saved });
});
