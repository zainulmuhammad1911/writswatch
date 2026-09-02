import { EmptyState, PageHeader, Table, Td, Th, Badge } from "@/components/admin/ui";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { requirePermission } from "@/lib/admin";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Audit log" };

const PAGE_SIZE = 100;

const TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  CREATE: "success",
  UPDATE: "warning",
  DELETE: "danger",
  LOGIN: "neutral",
  LOGOUT: "neutral",
};

export default async function AdminAuditPage({
  searchParams,
}: PageProps<"/admin/audit">) {
  await requirePermission("audit");
  const params = await searchParams;

  const str = (k: string) =>
    typeof params[k] === "string" && params[k] !== "all"
      ? (params[k] as string)
      : undefined;

  const action = str("action");
  const entity = str("entity");
  const from = str("from");
  const to = str("to");

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(`${from}T00:00:00Z`) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59Z`) } : {}),
          },
        }
      : {}),
  };

  const [rows, total, entities] = db
    ? await Promise.all([
        db.auditLog.findMany({
          where,
          include: { user: { select: { email: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: PAGE_SIZE,
        }),
        db.auditLog.count({ where }),
        db.auditLog.findMany({
          select: { entity: true },
          distinct: ["entity"],
          orderBy: { entity: "asc" },
        }),
      ])
    : [[], 0, []];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Audit log"
        description={`${total} record${total === 1 ? "" : "s"}. Every create, update and delete, oldest kept indefinitely.`}
      />

      <AdminSearch
        basePath="/admin/audit"
        searchable={false}
        filters={[
          {
            key: "action",
            label: "Action",
            options: ["all", "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"],
          },
          {
            key: "entity",
            label: "Record type",
            options: ["all", ...entities.map((e) => e.entity)],
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing recorded"
          description="Actions in the dashboard appear here as they happen."
        />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th className="w-40">When</Th>
                <Th className="w-48">Who</Th>
                <Th className="w-24">Action</Th>
                <Th className="w-32">Record</Th>
                <Th>Detail</Th>
                <Th className="w-32">From</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td className="whitespace-nowrap text-slate">
                    <time dateTime={row.createdAt.toISOString()}>
                      {row.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                    </time>
                  </Td>
                  <Td className="truncate text-slate">
                    {row.user.name || row.user.email}
                  </Td>
                  <Td>
                    <Badge tone={TONE[row.action] ?? "neutral"}>{row.action}</Badge>
                  </Td>
                  <Td className="text-slate">
                    {row.entity}
                    {row.entityId && (
                      <span className="block font-mono text-caption">
                        {row.entityId.slice(0, 10)}
                      </span>
                    )}
                  </Td>
                  <Td>
                    {row.details ? (
                      <code className="block max-w-[28rem] overflow-x-auto text-caption text-slate">
                        {row.details}
                      </code>
                    ) : (
                      <span className="text-slate">—</span>
                    )}
                  </Td>
                  <Td className="font-mono text-caption text-slate">
                    {row.ipAddress ?? "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          {total > rows.length && (
            <p className="text-caption text-slate">
              Showing the {rows.length} most recent of {total}. Narrow the
              filters to see older records.
            </p>
          )}
        </>
      )}
    </div>
  );
}
