import { PageHeader } from "@/components/admin/ui";
import { TimepieceForm } from "@/components/admin/TimepieceForm";
import { emptyTimepiece } from "@/lib/admin-forms";
import { requirePermission } from "@/lib/admin";
import { db } from "@/lib/db";

export const metadata = { title: "Add timepiece" };

async function loadCategories(): Promise<string[]> {
  if (!db) return [];
  const rows = await db.timepiece.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category).filter((c): c is string => Boolean(c));
}

export default async function NewTimepiecePage() {
  await requirePermission("collection", "create");
  const categories = await loadCategories();

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <PageHeader
        title="Add timepiece"
        description="Everything except brand, model and slug can be filled in later."
      />
      <TimepieceForm
        initial={emptyTimepiece()}
        categories={categories}
        canDelete={false}
      />
    </div>
  );
}
