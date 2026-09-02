import { cn } from "@/lib/utils";

/**
 * The placeholder for content that is still loading.
 *
 * Two rules shape it. It occupies the same space as the thing it stands in
 * for, measured off the real component, so nothing jumps when the content
 * arrives. And it is announced once, quietly: the shapes are `aria-hidden`
 * and a single live region says "Loading", rather than a screen reader
 * walking twenty empty boxes.
 *
 * The pulse is a CSS animation, so `motion-reduce` genuinely stops it. With
 * motion off the placeholder holds still at its resting tint, which is the
 * correct behaviour: the layout is still reserved, the flashing is what goes.
 *
 * There is only one of these, and only the collection listing uses it. The
 * other pages are prerendered, and a `loading.tsx` on a prerendered route is
 * actively harmful: it puts a Suspense boundary around HTML that was already
 * finished, so the served document contains the skeleton in place and the
 * real content in a `<div hidden>` at the end of the body, waiting for an
 * inline script to move it. Anything that does not run scripts — including
 * the page's own JSON-LD, which ends up inside that hidden div — then sees a
 * page of grey boxes. Measured, not assumed; see the README.
 */
function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-soft-grey motion-reduce:animate-none",
        className
      )}
    />
  );
}

/** Wraps a set of placeholder shapes and announces them once. */
function Loading({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p role="status" aria-live="polite" className="sr-only">
        {label}
      </p>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Matches CollectionGrid: 4/3 image, then two metadata lines. */
export function CollectionGridSkeleton({
  count = 12,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <Loading label="Loading the collection" className={className}>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <div className="aspect-[4/3] w-full animate-pulse border border-border-grey bg-soft-grey motion-reduce:animate-none" />
            <Bar className="mt-6 h-3 w-20" />
            <Bar className="mt-4 h-5 w-3/4" />
            <Bar className="mt-3 h-3 w-24" />
          </li>
        ))}
      </ul>
    </Loading>
  );
}
