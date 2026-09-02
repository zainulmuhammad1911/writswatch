import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { can, type Action, type Resource } from "@/lib/rbac";

/**
 * Server-side helpers for admin pages.
 *
 * Middleware already refuses anyone without a session, so these exist for the
 * next question: does this particular role get to see this particular page.
 */

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

export async function requireAdminUser(): Promise<AdminUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin");
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    role: session.user.role,
  };
}

/**
 * Sends a role that cannot see a page back to the dashboard rather than
 * showing an empty screen or a 403 they can do nothing about.
 */
export async function requirePermission(
  resource: Resource,
  action: Action = "read"
): Promise<AdminUser> {
  const user = await requireAdminUser();
  if (!can(user.role, resource, action)) {
    redirect("/admin?denied=" + encodeURIComponent(resource));
  }
  return user;
}

export interface NavItem {
  href: string;
  label: string;
  /** Omitted for the dashboard, which every role can see. */
  resource?: Resource;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/collection", label: "Collection", resource: "collection" },
  { href: "/admin/journal", label: "Journal", resource: "journal" },
  { href: "/admin/pages", label: "Pages", resource: "pages" },
  { href: "/admin/media", label: "Media", resource: "media" },
  { href: "/admin/settings", label: "Settings", resource: "settings" },
  { href: "/admin/audit", label: "Audit log", resource: "audit" },
];

/** The nav a given role should actually see. */
export function navFor(role: Role): NavItem[] {
  return ADMIN_NAV.filter(
    (item) => !item.resource || can(role, item.resource, "read")
  );
}
