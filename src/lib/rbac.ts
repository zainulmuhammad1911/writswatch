import type { Role } from "@/generated/prisma/client";

/**
 * Role-based access control.
 *
 * One matrix, consulted by both the API routes and the admin pages, so a
 * permission cannot drift between where it is enforced and where it is shown.
 */

export type Resource =
  | "collection"
  | "journal"
  | "media"
  | "pages"
  | "settings"
  | "users"
  | "audit";

export type Action = "read" | "create" | "update" | "delete";

/**
 * From the PRD:
 *   SUPER_ADMIN  everything, including user management and settings
 *   ADMIN        collection, journal, media, page content, read the audit log
 *   EDITOR       collection and journal (no delete), upload media
 */
const MATRIX: Record<Role, Partial<Record<Resource, Action[]>>> = {
  SUPER_ADMIN: {
    collection: ["read", "create", "update", "delete"],
    journal: ["read", "create", "update", "delete"],
    media: ["read", "create", "update", "delete"],
    pages: ["read", "create", "update", "delete"],
    settings: ["read", "create", "update", "delete"],
    users: ["read", "create", "update", "delete"],
    audit: ["read"],
  },
  ADMIN: {
    collection: ["read", "create", "update", "delete"],
    journal: ["read", "create", "update", "delete"],
    media: ["read", "create", "update", "delete"],
    pages: ["read", "create", "update", "delete"],
    audit: ["read"],
    // No settings, no users. Those stay with SUPER_ADMIN.
  },
  EDITOR: {
    collection: ["read", "create", "update"],
    journal: ["read", "create", "update"],
    // Upload and replace, but not delete: a removed file may still be
    // referenced by a record an editor cannot see.
    media: ["read", "create"],
    pages: ["read"],
  },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return MATRIX[role]?.[resource]?.includes(action) ?? false;
}

/** Everything a role may do, for rendering an admin nav that does not lie. */
export function permissionsFor(role: Role) {
  return MATRIX[role] ?? {};
}

/** Maps an HTTP method onto the action it performs. */
export function actionForMethod(method: string): Action {
  switch (method.toUpperCase()) {
    case "GET":
    case "HEAD":
      return "read";
    case "POST":
      return "create";
    case "PUT":
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return "read";
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
};
