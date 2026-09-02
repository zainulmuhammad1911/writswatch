import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The shared frame for the 404 and 500 pages.
 *
 * Both are built like a catalogue plate: a rule, a small label, a display
 * heading, one paragraph of plain explanation, and then real routes out. No
 * illustration and no apology written in a jokey voice, because the rest of
 * the site does not talk that way and an error page is a bad place to start.
 *
 * `min-h` rather than a fixed height, so the page fills the viewport under the
 * fixed header without the footer being pushed off a short screen.
 */
export function ErrorScreen({
  label,
  headline,
  children,
  actions,
  reference,
}: {
  label: string;
  headline: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  reference?: React.ReactNode;
}) {
  return (
    <section className="shell flex min-h-[70vh] flex-col justify-center py-section-sm md:py-section">
      <div className="max-w-[52ch]">
        <span aria-hidden="true" className="block h-px w-16 bg-navy" />
        <p className="eyebrow mt-8">{label}</p>
        <h1 className="mt-6 text-display text-graphite">{headline}</h1>
        <div className="measure mt-8 flex flex-col gap-5 text-body text-slate">
          {children}
        </div>
        {/* The reference sits with the explanation, not under the links: it
            is part of saying what happened, and a reader who has moved on to
            choosing a destination has no use for it. */}
        {reference}
        {actions}
      </div>
    </section>
  );
}

/**
 * The routes out, as an index rather than a row of buttons.
 *
 * A visitor who hit a dead end needs somewhere specific to go, and the three
 * things this site holds are more useful than one "Back to home" button.
 */
export function ErrorRoutes({
  routes,
  className,
}: {
  routes: { href: string; label: string; description: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Where to go instead" className={cn("mt-12", className)}>
      <ul className="flex flex-col border-t border-border-grey">
        {routes.map((route) => (
          <li key={route.href}>
            <Link
              href={route.href}
              className="group flex min-h-11 items-baseline justify-between gap-6 border-b border-border-grey py-5 transition-colors duration-base hover:bg-pure-white"
            >
              <span>
                <span className="font-display text-h3 text-graphite uppercase transition-colors duration-base group-hover:text-navy">
                  {route.label}
                </span>
                <span className="mt-1 block text-small text-slate">
                  {route.description}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 translate-y-1 text-slate transition-transform duration-base ease-out-museum group-hover:translate-x-1 group-hover:text-navy motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const ERROR_ROUTES = [
  {
    href: "/collection",
    label: "The Collection",
    description: "Every timepiece currently on display.",
  },
  {
    href: "/journal",
    label: "Journal",
    description: "Writing about the collection and the work around it.",
  },
  {
    href: "/about",
    label: "About",
    description: "What the museum is and how it is put together.",
  },
];
