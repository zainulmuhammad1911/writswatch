import { PageHeader } from "@/components/admin/ui";
import { MediaLibrary, type MediaItem } from "@/components/admin/MediaLibrary";
import { requirePermission } from "@/lib/admin";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";

export const metadata = { title: "Media" };

/**
 * Which media urls are still referenced, so a delete can warn rather than
 * silently leaving a broken image on the public site.
 */
async function loadUsage(): Promise<Record<string, string>> {
  if (!db) return {};
  const [images, articles] = await Promise.all([
    db.timepieceImage.findMany({
      select: { url: true, timepiece: { select: { brand: true, model: true } } },
    }),
    db.article.findMany({
      where: { coverImage: { not: null } },
      select: { coverImage: true, title: true },
    }),
  ]);

  const usage: Record<string, string> = {};
  for (const image of images) {
    usage[image.url] = `${image.timepiece.brand} ${image.timepiece.model}`;
  }
  for (const article of articles) {
    if (article.coverImage) usage[article.coverImage] = article.title;
  }
  return usage;
}

export default async function AdminMediaPage() {
  const user = await requirePermission("media");

  const rows = db
    ? await db.media.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
    : [];
  const usage = await loadUsage();

  const items: MediaItem[] = rows.map((r) => ({
    id: r.id,
    url: r.url,
    filename: r.filename,
    originalName: r.originalName,
    mimeType: r.mimeType,
    size: r.size,
    width: r.width,
    height: r.height,
    alt: r.alt,
    folder: r.folder,
    createdAt: r.createdAt.toISOString(),
  }));

  const folders = [
    ...new Set(rows.map((r) => r.folder ?? "general")),
  ].sort();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Media"
        description={`${items.length} file${items.length === 1 ? "" : "s"}. Everything is re-encoded on upload, which strips EXIF.`}
      />
      <MediaLibrary
        initial={items}
        folders={folders.length ? folders : ["collection", "journal", "general"]}
        canUpload={can(user.role, "media", "create")}
        canDelete={can(user.role, "media", "delete")}
        inUse={usage}
      />
    </div>
  );
}
