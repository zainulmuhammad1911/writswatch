import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

/**
 * Audit trail.
 *
 * Every create, update and delete gets a row: who, what, which record, what
 * changed, from where. The PRD asks for it and it is the only way to answer
 * "who deleted that timepiece" after the fact.
 *
 * Writing the log must never fail the operation it describes. A failed insert
 * is logged to the console and swallowed: losing an audit row is bad, but
 * rolling back a successful edit because the audit table was unreachable is
 * worse, and would be a denial of service on the whole CMS.
 */

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT";

export interface AuditEntry {
  userId: string;
  action: AuditAction;
  /** The model touched, e.g. "Timepiece". */
  entity: string;
  entityId?: string;
  /** Serialised to JSON. Keep it small and free of secrets. */
  details?: Prisma.InputJsonValue | Record<string, unknown>;
  request?: Request;
}

/** Never put one of these in `details`, whatever the caller passes. */
const REDACTED_KEYS = [
  "password",
  "hashedpassword",
  "token",
  "secret",
  "apikey",
  "authorization",
];

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[deep]";
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      out[key] = REDACTED_KEYS.includes(key.toLowerCase())
        ? "[redacted]"
        : redact(inner, depth + 1);
    }
    return out;
  }
  if (typeof value === "string" && value.length > 2000) {
    // Article bodies would otherwise fill the audit table.
    return `${value.slice(0, 2000)}… [${value.length} chars]`;
  }
  return value;
}

export async function audit(entry: AuditEntry): Promise<void> {
  if (!db) return;
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        details: entry.details
          ? JSON.stringify(redact(entry.details))
          : null,
        ipAddress: entry.request ? clientIp(entry.request) : null,
        userAgent: entry.request
          ? (entry.request.headers.get("user-agent") ?? "").slice(0, 500) || null
          : null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to record", entry.action, entry.entity, error);
  }
}

/** Only the fields that actually changed, for a readable UPDATE record. */
export function changedFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>
): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, next] of Object.entries(after)) {
    const previous = before[key];
    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      diff[key] = { from: previous, to: next };
    }
  }
  return diff;
}
