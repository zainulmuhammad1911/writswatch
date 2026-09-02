"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Star, Trash2, Upload } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { buttonVariants, inputClasses } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export interface ManagedImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ImageManagerProps {
  name: string;
  initial?: ManagedImage[];
  folder?: string;
}

interface UploadedMedia {
  url: string;
}

/**
 * Multi-image list with ordering and a primary choice.
 *
 * Order is changed with buttons, not drag alone. Drag-and-drop is unreachable
 * by keyboard and invisible to a screen reader, so the buttons are the real
 * control; dragging is layered on top for a mouse.
 *
 * The value is serialised into one hidden input as JSON, so the parent form
 * submits normally without lifting this state.
 */
export function ImageManager({
  name,
  initial = [],
  folder = "collection",
}: ImageManagerProps) {
  const [images, setImages] = useState<ManagedImage[]>(() =>
    initial.length
      ? initial.map((i, index) => ({ ...i, isPrimary: i.isPrimary || index === 0 }))
      : []
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function commit(next: ManagedImage[]) {
    // Exactly one primary, always. If the primary was removed, the first
    // remaining image inherits it.
    const withPrimary = next.length
      ? next.some((i) => i.isPrimary)
        ? next
        : next.map((i, index) => ({ ...i, isPrimary: index === 0 }))
      : next;
    setImages(withPrimary);
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const added: ManagedImage[] = [];
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        form.set("folder", folder);
        const media = await api.upload<UploadedMedia>("/api/media", form);
        added.push({ url: media.url, alt: "", isPrimary: false });
      }
      commit([...images, ...added]);
    } catch (e) {
      setError(
        e instanceof ApiClientError ? e.message : "Upload failed. Try again."
      );
      // Keep whatever did upload rather than discarding the successful ones.
      if (added.length) commit([...images, ...added]);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    commit(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name={name} value={JSON.stringify(images)} />

      <div className="flex flex-wrap items-center gap-3">
        <label className={cn(buttonVariants.secondary, "cursor-pointer")}>
          <Upload aria-hidden="true" className="size-4" />
          {busy ? "Uploading…" : "Add images"}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={busy}
            onChange={(e) => onFiles(e.target.files)}
            className="sr-only"
          />
        </label>
        <p className="text-caption text-slate">
          JPEG, PNG, WebP or AVIF. Up to 10MB each. EXIF is stripped on upload.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <p className="border border-dashed border-border-grey px-4 py-8 text-center text-small text-slate">
          No photographs yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {images.map((image, index) => (
            <li
              key={image.url}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) move(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={cn(
                "flex flex-wrap items-center gap-4 border border-border-grey bg-pure-white p-3",
                dragIndex === index && "opacity-50"
              )}
            >
              <div className="relative size-16 shrink-0 overflow-hidden border border-border-grey bg-soft-grey">
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-[12rem] flex-1">
                <label className="sr-only" htmlFor={`${name}-alt-${index}`}>
                  Alt text for image {index + 1}
                </label>
                <input
                  id={`${name}-alt-${index}`}
                  value={image.alt}
                  placeholder="Alt text, e.g. Omega Seamaster, dial detail"
                  onChange={(e) => {
                    const next = [...images];
                    next[index] = { ...image, alt: e.target.value };
                    commit(next);
                  }}
                  className={inputClasses}
                />
                <p className="mt-1 truncate text-caption text-slate">{image.url}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    commit(images.map((i, n) => ({ ...i, isPrimary: n === index })))
                  }
                  aria-pressed={image.isPrimary}
                  title={image.isPrimary ? "Primary image" : "Make primary"}
                  className={cn(
                    "inline-flex size-11 items-center justify-center transition-colors duration-fast",
                    image.isPrimary
                      ? "text-navy"
                      : "text-slate hover:bg-soft-grey hover:text-graphite"
                  )}
                >
                  <Star
                    aria-hidden="true"
                    className={cn("size-4", image.isPrimary && "fill-current")}
                  />
                  <span className="sr-only">
                    {image.isPrimary ? "Primary" : "Make primary"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  className="inline-flex size-11 items-center justify-center text-slate transition-colors duration-fast hover:bg-soft-grey hover:text-graphite disabled:opacity-30"
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                  <span className="sr-only">Move up</span>
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === images.length - 1}
                  className="inline-flex size-11 items-center justify-center text-slate transition-colors duration-fast hover:bg-soft-grey hover:text-graphite disabled:opacity-30"
                >
                  <ArrowDown aria-hidden="true" className="size-4" />
                  <span className="sr-only">Move down</span>
                </button>
                <button
                  type="button"
                  onClick={() => commit(images.filter((_, n) => n !== index))}
                  className="inline-flex size-11 items-center justify-center text-danger transition-colors duration-fast hover:bg-danger/8"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  <span className="sr-only">Remove from this timepiece</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-caption text-slate">
        Removing an image here detaches it from this timepiece. The file itself
        stays in the media library.
      </p>
    </div>
  );
}

export default ImageManager;
