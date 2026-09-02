"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import {
  Badge,
  EmptyState,
  buttonVariants,
  inputClasses,
} from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  folder: string | null;
  createdAt: string;
}

export interface MediaLibraryProps {
  initial: MediaItem[];
  folders: string[];
  canUpload: boolean;
  canDelete: boolean;
  /** urls referenced by a timepiece or article, so deletion can warn. */
  inUse: Record<string, string>;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibrary({
  initial,
  folders,
  canUpload,
  canDelete,
  inUse,
}: MediaLibraryProps) {
  const [items, setItems] = useState(initial);
  const [folder, setFolder] = useState("all");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const visible =
    folder === "all"
      ? items
      : items.filter((i) => (i.folder ?? "general") === folder);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setBusy(true);
      setError(null);
      setNotice(null);
      const added: MediaItem[] = [];
      const failed: string[] = [];

      for (const file of list) {
        try {
          const form = new FormData();
          form.set("file", file);
          if (folder !== "all") form.set("folder", folder);
          added.push(await api.upload<MediaItem>("/api/media", form));
        } catch (e) {
          failed.push(
            `${file.name}: ${e instanceof ApiClientError ? e.message : "failed"}`
          );
        }
      }

      // Report per file rather than aborting the batch, so one oversized image
      // among ten does not lose the other nine.
      if (added.length) setItems((prev) => [...added, ...prev]);
      if (added.length) setNotice(`${added.length} uploaded.`);
      if (failed.length) setError(failed.join(" · "));
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    },
    [folder]
  );

  useEffect(() => {
    const stop = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", stop);
    window.addEventListener("drop", stop);
    return () => {
      window.removeEventListener("dragover", stop);
      window.removeEventListener("drop", stop);
    };
  }, []);

  async function remove(item: MediaItem) {
    const usedBy = inUse[item.url];
    const warning = usedBy
      ? `${item.originalName} is still used by ${usedBy}. Deleting it will leave a broken image on the public site.\n\nDelete anyway?`
      : `Delete ${item.originalName}? The file is removed from disk permanently.`;
    if (!window.confirm(warning)) return;

    setError(null);
    try {
      await api.del(`/api/media/${item.id}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not delete");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[10rem]">
          <label htmlFor="media-folder" className="eyebrow">
            Folder
          </label>
          <select
            id="media-folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className={cn(inputClasses, "mt-2")}
          >
            <option value="all">All</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {canUpload && (
          <label className={cn(buttonVariants.primary, "cursor-pointer")}>
            {busy ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Upload aria-hidden="true" className="size-4" />
            )}
            {busy ? "Uploading…" : "Upload files"}
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              disabled={busy}
              onChange={(e) => e.target.files && upload(e.target.files)}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {canUpload && (
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
          }}
          className={cn(
            "border border-dashed px-6 py-8 text-center text-small transition-colors duration-base",
            dragging
              ? "border-navy bg-navy/6 text-navy"
              : "border-border-grey text-slate"
          )}
        >
          Drop images here to upload
          {folder !== "all" && ` into “${folder}”`}. JPEG, PNG, WebP or AVIF, up
          to 10MB each. EXIF is stripped.
        </div>
      )}

      {notice && <p className="text-small text-success">{notice}</p>}
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing here"
          description={
            folder === "all"
              ? "Upload the first file."
              : `No files in “${folder}”.`
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((item) => (
            <li
              key={item.id}
              className="flex flex-col border border-border-grey bg-pure-white"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-soft-grey">
                <Image
                  src={item.url}
                  alt={item.alt ?? ""}
                  fill
                  sizes="(min-width: 1024px) 22vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <p className="truncate text-caption font-medium text-graphite" title={item.originalName}>
                  {item.originalName}
                </p>
                <p className="text-caption text-slate">
                  {item.width && item.height
                    ? `${item.width}×${item.height} · `
                    : ""}
                  {humanSize(item.size)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge>{item.folder ?? "general"}</Badge>
                  {inUse[item.url] && <Badge tone="navy">in use</Badge>}
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="mt-auto inline-flex min-h-11 items-center gap-2 self-start text-caption text-danger transition-colors duration-fast hover:underline"
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MediaLibrary;
