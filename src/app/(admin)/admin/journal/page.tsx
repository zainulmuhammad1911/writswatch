import Link from "next/link";
import { PenLine } from "lucide-react";
import {
  Badge,
  ButtonLink,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { RowToggle } from "@/components/admin/RowToggle";
import { requirePermission } from "@/lib/admin";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";

export const metadata = { title: "Journal" };

export default async function AdminJournalPage({
  searchParams,
}: PageProps<"/admin/journal">) {
  const user = await requirePermission("journal");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : "all";

  const rows = db
    ? await db.article.findMany({
        where: {
          ...(status === "published" ? { published: true } : {}),
          ...(status === "draft" ? { published: false } : {}),
          ...(status === "featured" ? { featured: true } : {}),
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { subtitle: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          author: { select: { name: true, email: true } },
          _count: { select: { tags: true } },
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const canEdit = can(user.role, "journal", "update");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Journal"
        description={`${rows.length} article${rows.length === 1 ? "" : "s"}.`}
      >
        {can(user.role, "journal", "create") && (
          <ButtonLink href="/admin/journal/new">
            <PenLine aria-hidden="true" className="size-4" />
            Write article
          </ButtonLink>
        )}
      </PageHeader>

      <AdminSearch
        basePath="/admin/journal"
        placeholder="Search title or subtitle"
        filters={[
          { key: "status", label: "Status", options: ["all", "published", "draft", "featured"] },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={q || status !== "all" ? "Nothing matches that" : "No articles yet"}
          description={
            q || status !== "all"
              ? "Try a different search."
              : "The journal is empty."
          }
        >
          {!q && status === "all" && can(user.role, "journal", "create") && (
            <ButtonLink href="/admin/journal/new">Write article</ButtonLink>
          )}
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th className="w-24">Category</Th>
              <Th className="w-28">Date</Th>
              <Th className="w-32">Author</Th>
              <Th className="w-28">Published</Th>
              <Th className="w-28">Featured</Th>
              <Th className="w-20 text-right">Edit</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <Td>
                  <span className="font-medium">{row.title}</span>
                  {row.subtitle && (
                    <span className="block text-caption text-slate">
                      {row.subtitle}
                    </span>
                  )}
                </Td>
                <Td>
                  <Badge>{row.category.toLowerCase()}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-slate">
                  {row.publishedAt
                    ? row.publishedAt.toISOString().slice(0, 10)
                    : "—"}
                </Td>
                <Td className="truncate text-slate">
                  {row.author.name || row.author.email}
                </Td>
                <Td>
                  {canEdit ? (
                    <RowToggle
                      endpoint={`/api/journal/${row.id}`}
                      field="published"
                      value={row.published}
                      label={`Published state of ${row.title}`}
                    />
                  ) : (
                    <Badge tone={row.published ? "success" : "neutral"}>
                      {row.published ? "Yes" : "No"}
                    </Badge>
                  )}
                </Td>
                <Td>
                  {canEdit ? (
                    <RowToggle
                      endpoint={`/api/journal/${row.id}`}
                      field="featured"
                      value={row.featured}
                      label={`Featured state of ${row.title}`}
                    />
                  ) : (
                    <Badge tone={row.featured ? "navy" : "neutral"}>
                      {row.featured ? "Yes" : "No"}
                    </Badge>
                  )}
                </Td>
                <Td className="text-right">
                  <Link
                    href={`/admin/journal/${row.id}`}
                    className="inline-flex min-h-11 items-center text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark"
                  >
                    Edit
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
