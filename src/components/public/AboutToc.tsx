"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface AboutTocProps {
  items: { id: string; number: string; navLabel: string }[];
}

/**
 * Sticky table of contents for the About page.
 *
 * The active item is whichever section most recently crossed the top of the
 * reading area. `rootMargin` pushes the observation line down past the fixed
 * header and up from the bottom, so the highlight changes when a section
 * reaches the top of the viewport rather than when it first appears.
 *
 * Desktop only. On a phone six large headlines are easier to scroll than a
 * list of links to them.
 */
export function AboutToc({ items }: AboutTocProps) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Prefer the entry closest to the top of the reading area. Several can
        // be intersecting at once on a tall screen.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="On this page" className="sticky top-header-lg pt-4">
      <p className="eyebrow">On this page</p>
      <ol className="mt-6 flex flex-col gap-1">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group flex min-h-11 items-center gap-3 text-small transition-colors duration-fast",
                  isActive
                    ? "text-navy"
                    : "text-slate hover:text-graphite"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px shrink-0 transition-all duration-base ease-out-museum",
                    isActive ? "w-8 bg-navy" : "w-4 bg-border-grey"
                  )}
                />
                <span className="tabular-nums">{item.number}</span>
                {item.navLabel}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default AboutToc;
