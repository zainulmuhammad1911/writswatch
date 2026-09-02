"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { duration, ease, revealViewport } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface TimepieceGridItem {
  id: string;
  slug: string;
  brand: string;
  model: string;
  referenceNumber?: string;
  year?: number;
  image?: string;
  imageAlt?: string;
  imagePosition?: string;
}

export interface CollectionGridProps
  extends Omit<React.ComponentPropsWithoutRef<"ul">, "children"> {
  items?: readonly TimepieceGridItem[];
  /** Base path for each cell's link. */
  hrefBase?: string;
  /** Delay between neighbouring cells fading in, in seconds. */
  stagger?: number;
}

/**
 * The collection grid: one large photograph per timepiece with the minimum of
 * metadata under it, three across on desktop and one on a phone.
 *
 * Every cell is a real link, so the whole grid is keyboard navigable and each
 * timepiece can be opened in a new tab. The reveal is a plain fade-up, which
 * means a cell can never be left invisible by an animation that did not fire.
 */
export function CollectionGrid({
  items = [],
  hrefBase = "/collection",
  stagger = 0.05,
  className,
  ...props
}: CollectionGridProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16",
        className
      )}
      {...props}
    >
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          data-reveal=""
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={revealViewport}
          transition={{
            duration: duration.slow,
            ease: ease.out,
            // Cap the delay so the last cell of a long list is not left waiting.
            delay: Math.min(index * stagger, 0.4),
          }}
        >
          <Link
            href={`${hrefBase}/${item.slug}`}
            className="group block rounded-sm focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4 focus-visible:ring-offset-cool-white focus-visible:outline-none"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-border-grey bg-soft-grey transition-colors duration-base ease-out-museum group-hover:border-navy/30">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.imageAlt ?? `${item.brand} ${item.model}`}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover transition-transform duration-slow ease-out-museum group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  style={{ objectPosition: item.imagePosition ?? "center" }}
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <span className="text-caption tracking-caption text-slate uppercase">
                    No photograph yet
                  </span>
                </div>
              )}

              {/* "View" rises out of the bottom edge on hover. Decorative: the
                  link already says where it goes. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-navy px-4 py-3 transition-transform duration-base ease-out-museum group-hover:translate-y-0 motion-reduce:transition-none"
              >
                <span className="text-caption tracking-label text-pure-white uppercase">
                  View
                </span>
              </div>
            </div>

            <div className="pt-5">
              <h3 className="font-display text-h3 leading-none text-graphite">
                {item.brand.toUpperCase()}
              </h3>
              <p className="mt-2 text-body text-slate transition-colors duration-base group-hover:text-graphite">
                {item.model}
              </p>
              <p className="mt-3 text-caption tracking-caption text-slate uppercase">
                {item.referenceNumber && `Ref. ${item.referenceNumber}`}
                {item.referenceNumber && item.year && " · "}
                {item.year}
              </p>
            </div>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}

export default CollectionGrid;
