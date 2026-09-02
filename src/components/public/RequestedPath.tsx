"use client";

import { usePathname } from "next/navigation";

/**
 * Echoes the URL that was not found.
 *
 * Almost every 404 is a typo or a link that has gone stale, and seeing the
 * address back is what tells a visitor which of the two it was. Rendered as
 * text through React, so a path containing markup is escaped rather than
 * interpreted.
 */
export function RequestedPath() {
  const pathname = usePathname();
  if (!pathname) return null;
  return (
    <p className="mt-10 font-mono text-caption tracking-caption text-slate">
      <span className="text-slate">Requested</span>{" "}
      <span className="break-all text-graphite">{pathname}</span>
    </p>
  );
}
