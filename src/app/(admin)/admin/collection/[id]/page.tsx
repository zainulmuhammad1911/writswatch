import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { TimepieceForm } from "@/components/admin/TimepieceForm";
import { requirePermission } from "@/lib/admin";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";

export async function generateMetadata({
  params,
}: PageProps<"/admin/collection/[id]">) {
  const { id } = await params;
  if (!db) return { title: "Edit timepiece" };
  const row = await db.timepiece.findUnique({
    where: { id },
    select: { brand: true, model: true },
  });
  return { title: row ? `${row.brand} ${row.model}` : "Edit timepiece" };
}

export default async function EditTimepiecePage({
  params,
}: PageProps<"/admin/collection/[id]">) {
  const user = await requirePermission("collection");
  const { id } = await params;
  if (!db) notFound();

  const row = await db.timepiece.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!row) notFound();

  const categories = (
    await db.timepiece.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    })
  )
    .map((r) => r.category)
    .filter((c): c is string => Boolean(c));

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <PageHeader title={`${row.brand} ${row.model}`}>
        {row.published && (
          <Link
            href={`/collection/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark"
          >
            View on site
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
        )}
      </PageHeader>

      <TimepieceForm
        initial={{
          id: row.id,
          slug: row.slug,
          brand: row.brand,
          model: row.model,
          referenceNumber: row.referenceNumber ?? "",
          year: row.year?.toString() ?? "",
          category: row.category ?? "",
          movement: row.movement ?? "",
          caseSize: row.caseSize ?? "",
          caseMaterial: row.caseMaterial ?? "",
          dialColor: row.dialColor ?? "",
          description: row.description ?? "",
          story: row.story ?? "",
          published: row.published,
          featured: row.featured,
          images: row.images.map((i) => ({
            url: i.url,
            alt: i.alt ?? "",
            isPrimary: i.isPrimary,
          })),
        }}
        categories={categories}
        canDelete={can(user.role, "collection", "delete")}
      />
    </div>
  );
}
