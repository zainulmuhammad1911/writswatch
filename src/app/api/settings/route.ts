import type { NextRequest } from "next/server";
import { guard, handler, jsonBody, ok } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireDb } from "@/lib/db";
import { revalidateEverything } from "@/lib/revalidate";
import { updateSettingsSchema } from "@/lib/validation";

/**
 * GET /api/settings  every site setting
 * PUT /api/settings  upsert one or many
 */

export const GET = handler(async (request: NextRequest) => {
  await guard(request, "settings");
  const db = requireDb();
  const rows = await db.siteSetting.findMany({ orderBy: { key: "asc" } });

  // Keyed as well as listed. Callers want settings.values["site.title"].
  const values: Record<string, string> = {};
  for (const row of rows) values[row.key] = row.value;

  return ok({ settings: rows, values });
});

export const PUT = handler(async (request: NextRequest) => {
  const user = await guard(request, "settings");

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

  await audit({
    userId: user.id,
    action: "UPDATE",
    entity: "SiteSetting",
    details: { keys: settings.map((s) => s.key) },
    request,
  });

  // Site name, socials and SEO defaults appear on every page.
  revalidateEverything();

  return ok({ updated: saved.length, settings: saved });
});
