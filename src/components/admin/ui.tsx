import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared admin primitives.
 *
 * Denser than the public site (the design dial for a CMS is the opposite of a
 * museum page) but built from the same tokens, so the two read as one product.
 */

/* -------------------------------------------------------------------------- */
/*  Page furniture                                                            */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-grey pb-6">
      <div>
        <h1 className="font-display text-h2 text-graphite">{title}</h1>
        {description && (
          <p className="measure mt-2 text-small text-slate">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "border border-border-grey bg-pure-white p-5 shadow-surface",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const body = (
    <>
      <p className="eyebrow">{label}</p>
      <p
        data-numeric
        className="mt-3 font-display text-h1 leading-none text-graphite"
      >
        {value}
      </p>
    </>
  );

  if (!href) return <Card>{body}</Card>;
  return (
    <Link
      href={href}
      className="block border border-border-grey bg-pure-white p-5 shadow-surface transition-colors duration-base hover:border-navy/40 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cool-white focus-visible:outline-none"
    >
      {body}
    </Link>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-border-grey bg-pure-white px-6 py-16 text-center">
      <p className="font-display text-h3 text-graphite">{title}</p>
      {description && (
        <p className="measure mx-auto mt-3 text-small text-slate">
          {description}
        </p>
      )}
      {children && <div className="mt-6 flex justify-center gap-3">{children}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Buttons                                                                   */
/* -------------------------------------------------------------------------- */

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 px-5 text-small font-medium transition-colors duration-base ease-out-museum focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cool-white focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

export const buttonVariants = {
  primary: cn(buttonBase, "bg-navy text-pure-white hover:bg-navy-dark"),
  secondary: cn(
    buttonBase,
    "border border-border-grey bg-pure-white text-graphite hover:border-navy/40 hover:bg-cool-white"
  ),
  danger: cn(
    buttonBase,
    "border border-danger/40 bg-pure-white text-danger hover:bg-danger/8"
  ),
  ghost: cn(buttonBase, "px-3 text-slate hover:bg-soft-grey hover:text-graphite"),
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonVariants[variant], className)}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Table                                                                     */
/* -------------------------------------------------------------------------- */

export function Table({ children }: { children: React.ReactNode }) {
  // Wide tables scroll inside their own container so the page body never does.
  return (
    <div className="overflow-x-auto border border-border-grey bg-pure-white">
      <table className="w-full min-w-[52rem] border-collapse text-small">
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-border-grey px-4 py-3 text-left text-caption tracking-label text-slate uppercase",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "border-b border-border-grey px-4 py-3 align-middle text-graphite",
        className
      )}
    >
      {children}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/*  Badges                                                                    */
/* -------------------------------------------------------------------------- */

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "navy";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border-border-grey bg-cool-white text-slate",
    success: "border-success/30 bg-success/8 text-success",
    warning: "border-warning/30 bg-warning/8 text-warning",
    danger: "border-danger/30 bg-danger/8 text-danger",
    navy: "border-navy/30 bg-navy/8 text-navy",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-caption tracking-caption uppercase",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form fields                                                               */
/* -------------------------------------------------------------------------- */

export const inputClasses =
  "min-h-11 w-full border border-border-grey bg-pure-white px-3 text-small text-graphite transition-colors duration-fast focus-visible:border-navy focus-visible:outline-none disabled:bg-cool-white disabled:text-slate";

export const textareaClasses = cn(inputClasses, "min-h-32 py-2.5 leading-[1.6]");

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="eyebrow">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {" *"}
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-caption text-slate">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
