import { PageHeader } from "@/components/admin/ui";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { emptyArticle } from "@/lib/admin-forms";
import { requirePermission } from "@/lib/admin";

export const metadata = { title: "Write article" };

export default async function NewArticlePage() {
  await requirePermission("journal", "create");
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <PageHeader
        title="Write article"
        description="Saved as a draft unless you tick Published."
      />
      <ArticleForm initial={emptyArticle()} canDelete={false} />
    </div>
  );
}
