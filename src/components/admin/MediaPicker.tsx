"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { buttonVariants, inputClasses } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

interface MediaRow {
  id: string;
  url: string;
  alt: string | null;
  filename: string;
  width: number | null;
  height: number | null;
}

export interface MediaPickerProps {
  name: string;
  altName?: string;
  value?: string;
  altValue?: string;
  folder?: string;
  label?: string;
}

/**
 * Single-image chooser: pick from the library or upload on the spot.
 *
 * The library is fetched only when the picker is opened, so a form with three
 * of these does not make three requests on load.
 */
export function MediaPicker({
  name,
  altName,
  value = "",
  altValue = "",
  folder = "journal",
  label = "Choose image",
}: MediaPickerProps) {
  const [url, setUrl] = useState(value);
  const [alt, setAlt] = useState(altValue);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || items) return;
    let cancelled = false;
    api
      .get<{ items: MediaRow[] }>(`/api/media?take=60`)
      .then((data) => !cancelled && setItems(data.items))
      .catch((e) =>
        !cancelled &&
        setError(e instanceof ApiClientError ? e.message : "Could not load media")
      );
    return () => {
      cancelled = true;
    };
  }, [open, items]);

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", files[0]);
      form.set("folder", folder);
      const media = await api.upload<MediaRow>("/api/media", form);
      setUrl(media.url);
      setItems((prev) => (prev ? [media, ...prev] : [media]));
      setOpen(false);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={url} />
      {altName && <input type="hidden" name={altName} value={alt} />}

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative aspect-[16/9] w-40 shrink-0 overflow-hidden border border-border-grey bg-soft-grey">
          {url ? (
            <Image src={url} alt="" fill sizes="160px" className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center">
              <ImagePlus aria-hidden="true" className="size-5 text-slate" />
            </div>
          )}
        </div>

        <div className="flex min-w-[14rem] flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={buttonVariants.secondary}
            >
              {open ? "Close library" : label}
            </button>
            <label className={cn(buttonVariants.secondary, "cursor-pointer")}>
              {busy ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Upload aria-hidden="true" className="size-4" />
              )}
              Upload
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={busy}
                onChange={(e) => onUpload(e.target.files)}
                className="sr-only"
              />
            </label>
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className={buttonVariants.ghost}
              >
                <X aria-hidden="true" className="size-4" />
                Remove
              </button>
            )}
          </div>

          {altName && (
            <>
              <label htmlFor={`${name}-alt`} className="eyebrow">
                Alt text
              </label>
              <input
                id={`${name}-alt`}
                value={alt}
                placeholder="What the photograph shows"
                onChange={(e) => setAlt(e.target.value)}
                className={inputClasses}
              />
            </>
          )}

          {url && <p className="truncate text-caption text-slate">{url}</p>}
          {error && (
            <p role="alert" className="text-caption text-danger">
              {error}
            </p>
          )}
        </div>
      </div>

      {open && (
        <div className="border border-border-grey bg-cool-white p-4">
          {!items ? (
            <p className="text-small text-slate">Loading library…</p>
          ) : items.length === 0 ? (
            <p className="text-small text-slate">
              The media library is empty. Upload something above.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setUrl(item.url);
                      if (altName && !alt && item.alt) setAlt(item.alt);
                      setOpen(false);
                    }}
                    aria-pressed={url === item.url}
                    title={item.filename}
                    className={cn(
                      "relative block aspect-square w-full overflow-hidden border bg-soft-grey transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none",
                      url === item.url
                        ? "border-navy"
                        : "border-border-grey hover:border-navy/40"
                    )}
                  >
                    <Image
                      src={item.url}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default MediaPicker;
