import Link from "next/link";
import { ArrowUpRight, ImagePlus, PenLine, Plus } from "lucide-react";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { requireAdminUser } from "@/lib/admin";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";

export const metadata = { title: "Dashboard" };

/** Reads Prisma directly, like the public pages. No self-fetch. */
async function loadStats() {
  if (!db) return null;
  const [timepieces, articles, media, users, activity] = await Promise.all([
    db.timepiece.count(),
    db.article.count(),
    db.media.count(),
    db.user.count({ where: { active: true } }),
    db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);
  return { timepieces, articles, media, users, activity };
}

export default async function AdminDashboard({
  searchParams,
}: PageProps<"/admin">) {
  const user = await requireAdminUser();
  const params = await searchParams;
  const denied = typeof params.denied === "string" ? params.denied : null;
  const stats = await loadStats();

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${user.email}.`}
      />

      {denied && (
        <p
          role="alert"
          className="border-l-2 border-danger bg-pure-white px-4 py-3 text-small text-graphite"
        >
          Your role does not have access to {denied}.
        </p>
      )}

      {!stats ? (
        <EmptyState
          title="No database connected"
          description="Set DATABASE_URL and run the migration. See the README."
        />
      ) : (
        <>
          <section aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="sr-only">
              Totals
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Timepieces"
                value={stats.timepieces}
                href={can(user.role, "collection", "read") ? "/admin/collection" : undefined}
              />
              <StatCard
                label="Articles"
                value={stats.articles}
                href={can(user.role, "journal", "read") ? "/admin/journal" : undefined}
              />
              <StatCard
                label="Media"
                value={stats.media}
                href={can(user.role, "media", "read") ? "/admin/media" : undefined}
              />
              <StatCard
                label="Active users"
                value={stats.users}
                href={can(user.role, "users", "read") ? "/admin/settings?tab=users" : undefined}
              />
            </div>
          </section>

          <section aria-labelledby="actions-heading">
            <h2 id="actions-heading" className="eyebrow">
              Quick actions
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {can(user.role, "collection", "create") && (
                <ButtonLink href="/admin/collection/new">
                  <Plus aria-hidden="true" className="size-4" />
                  Add timepiece
                </ButtonLink>
              )}
              {can(user.role, "journal", "create") && (
                <ButtonLink href="/admin/journal/new" variant="secondary">
                  <PenLine aria-hidden="true" className="size-4" />
                  Write article
                </ButtonLink>
              )}
              {can(user.role, "media", "create") && (
                <ButtonLink href="/admin/media" variant="secondary">
                  <ImagePlus aria-hidden="true" className="size-4" />
                  Upload media
                </ButtonLink>
              )}
            </div>
          </section>

          {can(user.role, "audit", "read") && (
            <section aria-labelledby="activity-heading">
              <div className="flex items-center justify-between gap-4">
                <h2 id="activity-heading" className="eyebrow">
                  Recent activity
                </h2>
                <Link
                  href="/admin/audit"
                  className="inline-flex items-center gap-1.5 text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark"
                >
                  Full audit log
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>

              <div className="mt-4">
                {stats.activity.length === 0 ? (
                  <Card>
                    <p className="text-small text-slate">
                      Nothing recorded yet. Every create, update and delete
                      appears here.
                    </p>
                  </Card>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>When</Th>
                        <Th>Who</Th>
                        <Th>Action</Th>
                        <Th>Record</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.activity.map((row) => (
                        <tr key={row.id}>
                          <Td className="whitespace-nowrap text-slate">
                            <time dateTime={row.createdAt.toISOString()}>
                              {row.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                            </time>
                          </Td>
                          <Td className="text-slate">
                            {row.user.name || row.user.email}
                          </Td>
                          <Td>{row.action}</Td>
                          <Td className="text-slate">
                            {row.entity}
                            {row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
