import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import {
  PageContentEditor,
  type ContentEntry,
} from "@/components/admin/PageContentEditor";
import { requirePermission } from "@/lib/admin";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pages" };

const PAGES = [
  { key: "home", label: "Home", href: "/" },
  { key: "about", label: "About", href: "/about" },
  { key: "collection", label: "Collection", href: "/collection" },
  { key: "journal", label: "Journal", href: "/journal" },
] as const;

export default async function AdminPagesPage({
  searchParams,
}: PageProps<"/admin/pages">) {
  const user = await requirePermission("pages");
  const params = await searchParams;
  const requested = typeof params.page === "string" ? params.page : "home";
  const active = PAGES.find((p) => p.key === requested) ?? PAGES[0];

  const rows = db
    ? await db.pageContent.findMany({
        where: { page: active.key },
        orderBy: [{ section: "asc" }, { key: "asc" }],
      })
    : [];

  const entries: ContentEntry[] = rows.map((r) => ({
    page: r.page,
    section: r.section,
    key: r.key,
    value: r.value,
    type: r.type,
  }));

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <PageHeader
        title="Page content"
        description="Copy that is not a timepiece or an article."
      />

      <nav aria-label="Choose a page" className="flex flex-wrap gap-1">
        {PAGES.map((p) => (
          <Link
            key={p.key}
            href={`/admin/pages?page=${p.key}`}
            aria-current={p.key === active.key ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-sm px-4 text-small transition-colors duration-fast",
              p.key === active.key
                ? "bg-navy text-pure-white"
                : "text-slate hover:bg-soft-grey hover:text-graphite"
            )}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <PageContentEditor
        page={active.label}
        previewHref={active.href}
        entries={entries}
        canEdit={can(user.role, "pages", "update")}
      />
    </div>
  );
}
