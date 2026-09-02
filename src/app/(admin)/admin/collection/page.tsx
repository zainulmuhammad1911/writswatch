import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  Badge,
  ButtonLink,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { RowToggle } from "@/components/admin/RowToggle";
import { requirePermission } from "@/lib/admin";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { AdminSearch } from "@/components/admin/AdminSearch";

export const metadata = { title: "Collection" };

export default async function AdminCollectionPage({
  searchParams,
}: PageProps<"/admin/collection">) {
  const user = await requirePermission("collection");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : "all";

  const rows = db
    ? await db.timepiece.findMany({
        where: {
          ...(status === "published" ? { published: true } : {}),
          ...(status === "draft" ? { published: false } : {}),
          ...(status === "featured" ? { featured: true } : {}),
          ...(q
            ? {
                OR: [
                  { brand: { contains: q, mode: "insensitive" } },
                  { model: { contains: q, mode: "insensitive" } },
                  { referenceNumber: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy: [{ sortOrder: "asc" }, { brand: "asc" }, { model: "asc" }],
      })
    : [];

  const canEdit = can(user.role, "collection", "update");
  const canDelete = can(user.role, "collection", "delete");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Collection"
        description={`${rows.length} record${rows.length === 1 ? "" : "s"}${q || status !== "all" ? " matching" : ""}.`}
      >
        {can(user.role, "collection", "create") && (
          <ButtonLink href="/admin/collection/new">
            <Plus aria-hidden="true" className="size-4" />
            Add timepiece
          </ButtonLink>
        )}
      </PageHeader>

      <AdminSearch
        basePath="/admin/collection"
        placeholder="Search brand, model or reference"
        filters={[
          { key: "status", label: "Status", options: ["all", "published", "draft", "featured"] },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={q || status !== "all" ? "Nothing matches that" : "No timepieces yet"}
          description={
            q || status !== "all"
              ? "Try a different search or clear the filter."
              : "Add the first record to get started."
          }
        >
          {!q && status === "all" && can(user.role, "collection", "create") && (
            <ButtonLink href="/admin/collection/new">Add timepiece</ButtonLink>
          )}
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th className="w-16">Photo</Th>
              <Th>Brand</Th>
              <Th>Model</Th>
              <Th className="w-24">Ref.</Th>
              <Th className="w-20">Year</Th>
              <Th className="w-28">Published</Th>
              <Th className="w-28">Featured</Th>
              <Th className="w-20 text-right">Edit</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const image = row.images[0];
              return (
                <tr key={row.id}>
                  <Td>
                    <div className="relative size-11 overflow-hidden border border-border-grey bg-soft-grey">
                      {image && (
                        <Image
                          src={image.url}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      )}
                    </div>
                  </Td>
                  <Td className="font-medium">{row.brand}</Td>
                  <Td className="text-slate">{row.model}</Td>
                  <Td className="text-slate">{row.referenceNumber ?? "—"}</Td>
                  <Td className="text-slate">{row.year ?? "—"}</Td>
                  <Td>
                    {canEdit ? (
                      <RowToggle
                        endpoint={`/api/collection/${row.id}`}
                        field="published"
                        value={row.published}
                        label={`Published state of ${row.brand} ${row.model}`}
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
                        endpoint={`/api/collection/${row.id}`}
                        field="featured"
                        value={row.featured}
                        label={`Featured state of ${row.brand} ${row.model}`}
                      />
                    ) : (
                      <Badge tone={row.featured ? "navy" : "neutral"}>
                        {row.featured ? "Yes" : "No"}
                      </Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/admin/collection/${row.id}`}
                      className="inline-flex min-h-11 items-center text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark"
                    >
                      {canDelete || canEdit ? "Edit" : "View"}
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
