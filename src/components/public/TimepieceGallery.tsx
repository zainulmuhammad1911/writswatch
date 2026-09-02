"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Expand, X } from "lucide-react";
import type { TimepieceImage } from "@/types";
import { cn } from "@/lib/utils";

export interface TimepieceGalleryProps {
  images: TimepieceImage[];
  /** Used to build a sensible alt when an image has none. */
  name: string;
}

/**
 * One large photograph with thumbnails under it, and a lightbox for a closer
 * look.
 *
 * The lightbox is a native <dialog> opened with showModal(), which brings the
 * focus trap, the Escape handler and the backdrop with it rather than us
 * reimplementing all three.
 */
export function TimepieceGallery({ images, name }: TimepieceGalleryProps) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const current = images[index] ?? images[0];
  const hasMany = images.length > 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!current) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge photograph of ${name}`}
        className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden border border-border-grey bg-soft-grey focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4 focus-visible:ring-offset-cool-white focus-visible:outline-none"
      >
        <Image
          src={current.src}
          alt={current.alt ?? name}
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover transition-transform duration-slow ease-out-museum group-hover:scale-[1.02] motion-reduce:transition-none"
        />
        <span
          aria-hidden="true"
          className="absolute right-4 bottom-4 grid size-11 place-items-center rounded-full bg-pure-white/85 text-graphite opacity-0 backdrop-blur-sm transition-opacity duration-base group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <Expand className="size-4" />
        </span>
      </button>

      {hasMany && (
        <ul className="mt-4 flex flex-wrap gap-3">
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photograph ${i + 1} of ${images.length}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "relative size-20 overflow-hidden border transition-colors duration-base focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cool-white focus-visible:outline-none",
                  i === index
                    ? "border-navy"
                    : "border-border-grey hover:border-navy/40"
                )}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // Clicks land on the dialog itself only when they miss the image.
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className="max-h-none max-w-none bg-transparent backdrop:bg-graphite/85 backdrop:backdrop-blur-sm"
        style={{ width: "100vw", height: "100vh" }}
      >
        <div className="relative grid h-full w-full place-items-center p-4 sm:p-10">
          <Image
            src={current.src}
            alt={current.alt ?? name}
            width={1600}
            height={2000}
            sizes="100vw"
            className="max-h-full w-auto max-w-full object-contain"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute top-4 right-4 grid size-12 place-items-center rounded-full bg-pure-white text-graphite transition-colors duration-base hover:bg-cool-white focus-visible:ring-2 focus-visible:ring-pure-white focus-visible:outline-none sm:top-8 sm:right-8"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </dialog>
    </div>
  );
}

export default TimepieceGallery;
