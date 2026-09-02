"use client";

import { useEffect } from "react";
import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

/**
 * The last resort: an error thrown by the root layout itself.
 *
 * Because it replaces the root layout, this file has to supply its own
 * `<html>` and `<body>`, and it cannot use the header or footer — those live
 * inside the tree that has just failed. It imports the stylesheet and the font
 * variables directly so the page is still recognisably the museum's rather
 * than the browser's default serif on white.
 *
 * Nothing here reads from the database. A root-layout failure is most likely a
 * failed query in the first place, so this page has to render without one.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root] layout failed", error);
  }, [error]);

  return (
    <html lang="en" className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col bg-cool-white text-graphite">
        <main className="shell flex flex-1 flex-col justify-center py-section">
          <div className="max-w-[52ch]">
            <span aria-hidden="true" className="block h-px w-16 bg-navy" />
            <p className="eyebrow mt-8">Indonesia Wristwatch Museum</p>
            <h1 className="mt-6 text-display text-graphite">
              The site is not loading.
            </h1>
            <div className="measure mt-8 flex flex-col gap-5 text-body text-slate">
              <p>
                Something failed before any page could be built, which means the
                fault is with the site rather than with the address you used.
              </p>
              <p>
                It is worth one reload. If the problem persists it is being
                worked on at our end, and the collection will be here when it is
                fixed.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-11 items-center rounded-full bg-navy px-6 text-small font-medium tracking-caption text-pure-white uppercase transition-colors duration-base hover:bg-navy-dark"
              >
                Reload
              </button>
              {/* A plain anchor, not next/link: the router lives in the tree
                  that has just failed, so a full document load is the only
                  navigation that can be trusted here. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className="min-h-11 text-small font-medium text-navy underline decoration-navy/30 underline-offset-4 transition-colors duration-fast hover:text-navy-dark hover:decoration-navy"
              >
                Start from the homepage
              </a>
            </div>
            {error.digest && (
              <p className="mt-12 font-mono text-caption tracking-caption text-slate">
                <span className="text-slate">Reference</span>{" "}
                <span className="text-graphite">{error.digest}</span>
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
