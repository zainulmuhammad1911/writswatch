"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import {
  ERROR_ROUTES,
  ErrorRoutes,
  ErrorScreen,
} from "@/components/public/ErrorScreen";

/**
 * 500, for anything that throws while rendering a public page.
 *
 * `error.message` is deliberately not shown. In production Next replaces it
 * with a generic string anyway, and in development printing a stack trace into
 * the page would train us to ship one. What is shown is `error.digest`: the
 * hash Next also writes to the server log, which is the one string that makes
 * a report traceable. It is safe to display because it identifies the error
 * without describing it.
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Next logs this server side. This is the client half: without it a render
    // that only fails in the browser leaves nothing behind.
    console.error("[public] render failed", error);
  }, [error]);

  return (
    <ErrorScreen
      label="500"
      headline="Something failed at our end."
      reference={
        error.digest ? (
          <p className="mt-10 font-mono text-caption tracking-caption text-slate">
            <span className="text-slate">Reference</span>{" "}
            <span className="text-graphite">{error.digest}</span>
          </p>
        ) : undefined
      }
      actions={
        <>
          <div className="mt-10">
            <button
              type="button"
              onClick={reset}
              className="group inline-flex min-h-11 items-center gap-2.5 rounded-full bg-navy px-6 text-small font-medium tracking-caption text-pure-white uppercase transition-colors duration-base hover:bg-navy-dark"
            >
              <RotateCcw
                aria-hidden="true"
                className="size-4 transition-transform duration-slow ease-out-museum group-hover:-rotate-45 motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
              />
              Try again
            </button>
          </div>
          <ErrorRoutes routes={ERROR_ROUTES} />
        </>
      }
    >
      <p>
        The page could not be built. This is a fault here rather than anything
        you did, and nothing you were looking at has been lost or changed.
      </p>
      <p>
        Reloading often works, because most failures of this kind are a database
        query that timed out once. If it keeps happening, the reference below
        identifies this exact error in our logs.
      </p>
    </ErrorScreen>
  );
}
