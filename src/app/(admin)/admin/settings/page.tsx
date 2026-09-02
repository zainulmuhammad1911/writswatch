import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { UserManager, type ManagedUser } from "@/components/admin/UserManager";
import { requirePermission } from "@/lib/admin";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage({
  searchParams,
}: PageProps<"/admin/settings">) {
  // Settings is SUPER_ADMIN in the matrix, so this covers both tabs.
  const user = await requirePermission("settings");
  const params = await searchParams;
  const tab = params.tab === "users" ? "users" : "site";

  const showUsers = can(user.role, "users", "read");

  const [settings, users] = await Promise.all([
    db ? db.siteSetting.findMany() : Promise.resolve([]),
    showUsers && db
      ? db.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            active: true,
            _count: { select: { articles: true, auditLogs: true } },
          },
          orderBy: [{ role: "asc" }, { email: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  const values: Record<string, string> = {};
  for (const row of settings) values[row.key] = row.value;

  const managedUsers: ManagedUser[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.active,
    articles: u._count.articles,
    auditLogs: u._count.auditLogs,
  }));

  const tabs = [
    { key: "site", label: "Site" },
    ...(showUsers ? [{ key: "users", label: "Users" }] : []),
  ];

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Site details and staff accounts."
      />

      {tabs.length > 1 && (
        <nav aria-label="Settings sections" className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/admin/settings?tab=${t.key}`}
              aria-current={t.key === tab ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-sm px-4 text-small transition-colors duration-fast",
                t.key === tab
                  ? "bg-navy text-pure-white"
                  : "text-slate hover:bg-soft-grey hover:text-graphite"
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      )}

      {tab === "users" && showUsers ? (
        <UserManager initial={managedUsers} currentUserId={user.id} />
      ) : (
        <SettingsForm
          values={values}
          canEdit={can(user.role, "settings", "update")}
        />
      )}
    </div>
  );
}
