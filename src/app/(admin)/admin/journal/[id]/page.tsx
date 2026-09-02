import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { requirePermission } from "@/lib/admin";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";

export async function generateMetadata({
  params,
}: PageProps<"/admin/journal/[id]">) {
  const { id } = await params;
  if (!db) return { title: "Edit article" };
  const row = await db.article.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: row?.title ?? "Edit article" };
}

export default async function EditArticlePage({
  params,
}: PageProps<"/admin/journal/[id]">) {
  const user = await requirePermission("journal");
  const { id } = await params;
  if (!db) notFound();

  const row = await db.article.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });
  if (!row) notFound();

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <PageHeader title={row.title}>
        {row.published && (
          <Link
            href={`/journal/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark"
          >
            View on site
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
        )}
      </PageHeader>

      <ArticleForm
        initial={{
          id: row.id,
          slug: row.slug,
          title: row.title,
          subtitle: row.subtitle ?? "",
          category: row.category,
          excerpt: row.excerpt ?? "",
          content: row.content,
          coverImage: row.coverImage ?? "",
          coverImageAlt: row.coverImageAlt ?? "",
          tags: row.tags.map((t) => t.tag.name).join(", "),
          published: row.published,
          featured: row.featured,
          publishedAt: row.publishedAt
            ? row.publishedAt.toISOString().slice(0, 10)
            : "",
        }}
        canDelete={can(user.role, "journal", "delete")}
      />
    </div>
  );
}
