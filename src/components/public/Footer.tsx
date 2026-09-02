"use client";

import Image from "next/image";
import Link from "next/link";
import { NAV_ITEMS, type NavItem } from "@/components/public/Header";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Social marks                                                              */
/*  Lucide dropped its brand glyphs in v1, so these are drawn here. All four  */
/*  are filled paths on a 24px box so the row reads as one set.               */
/* -------------------------------------------------------------------------- */

const iconClass = "size-5";

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={iconClass}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.98c-3.14 0-3.49.01-4.72.07-.94.04-1.4.19-1.72.31-.36.14-.6.3-.86.56-.26.26-.42.5-.56.86-.12.32-.27.78-.31 1.72-.06 1.23-.07 1.58-.07 4.72s.01 3.49.07 4.72c.4.94.19 1.4.31 1.72.14.36.3.6.56.86.26.26.5.42.86.56.32.12.78.27 1.72.31 1.23.06 1.58.07 4.72.07s3.49-.01 4.72-.07c.94-.04 1.4-.19 1.72-.31.36-.14.6-.3.86-.56.26-.26.42-.5.56-.86.12-.32.27-.78.31-1.72.06-1.23.07-1.58.07-4.72s-.01-3.49-.07-4.72c-.04-.94-.19-1.4-.31-1.72a2.32 2.32 0 0 0-.56-.86 2.32 2.32 0 0 0-.86-.56c-.32-.12-.78-.27-1.72-.31-1.23-.06-1.58-.07-4.72-.07Zm0 3.37a4.49 4.49 0 1 1 0 8.98 4.49 4.49 0 0 1 0-8.98Zm0 7.4a2.91 2.91 0 1 0 0-5.82 2.91 2.91 0 0 0 0 5.82Zm5.72-7.6a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0Z" />
    </svg>
  );
}

function YouTubeMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={iconClass}>
      <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={iconClass}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function MailMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={iconClass}>
      <path d="M2.5 6.75A2.25 2.25 0 0 1 4.75 4.5h14.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25H4.75a2.25 2.25 0 0 1-2.25-2.25V6.75Zm2.06-.25L12 12.06 19.44 6.5H4.56Zm14.94 1.4-6.9 5.16a1.75 1.75 0 0 1-2.1 0L4.5 7.9v9.35c0 .14.11.25.25.25h14.5c.14 0 .25-.11.25-.25V7.9Z" />
    </svg>
  );
}

interface SocialLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

/** The addresses, as an editor sets them in Settings. */
export interface SocialAddresses {
  instagram?: string;
  youtube?: string;
  x?: string;
  email?: string;
}

/**
 * Turns the settings into the row of cards, dropping anything unset.
 *
 * A social card that goes nowhere is worse than a missing one, so an empty
 * setting removes the icon rather than linking to the platform's homepage.
 */
function socialLinks(addresses: SocialAddresses): SocialLink[] {
  const candidates: { label: string; href?: string; icon: React.ReactNode }[] = [
    { label: "Instagram", href: addresses.instagram, icon: <InstagramMark /> },
    { label: "YouTube", href: addresses.youtube, icon: <YouTubeMark /> },
    { label: "X", href: addresses.x, icon: <XMark /> },
    {
      label: "Email",
      href: addresses.email ? `mailto:${addresses.email}` : undefined,
      icon: <MailMark />,
    },
  ];
  return candidates.filter((link): link is SocialLink => Boolean(link.href));
}

/**
 * Icon-only card. The label is the accessible name and the tooltip, never
 * visible text, so the row stays as quiet as the rest of the footer.
 */
function SocialCard({ link }: { link: SocialLink }) {
  const external = link.href.startsWith("http");
  return (
    <a
      href={link.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      aria-label={link.label}
      title={link.label}
      className="group relative grid size-14 place-items-center overflow-hidden rounded-md border border-border-grey bg-pure-white text-slate transition-[transform,border-color,color,box-shadow] duration-base ease-out-museum hover:-translate-y-1 hover:border-navy/40 hover:text-navy hover:shadow-raised focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-cool-white focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* A wash of navy that rises from the bottom of the card on hover. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-y-full bg-navy/6 transition-transform duration-base ease-out-museum group-hover:translate-y-0 motion-reduce:transition-none"
      />
      <span className="relative">{link.icon}</span>
    </a>
  );
}

export interface FooterProps {
  items?: NavItem[];
  social?: SocialAddresses;
  /** Site name, for the copyright line. From Settings. */
  siteName?: string;
  /** Rendered on the server so the year cannot drift between the two. */
  year?: number;
  className?: string;
}

export function Footer({
  items = NAV_ITEMS,
  social = {},
  siteName = "Indonesia Wristwatch Museum",
  year = 2026,
  className,
}: FooterProps) {
  const links = socialLinks(social);
  return (
    <footer
      className={cn("border-t border-border-grey bg-cool-white", className)}
    >
      <div className="shell py-16 lg:py-24">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <Link
            href="/"
            aria-label="Indonesia Wristwatch Museum — home"
            className="flex items-center gap-6 self-start rounded-sm focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4 focus-visible:ring-offset-cool-white focus-visible:outline-none"
          >
            {/* Same mark as the header, at twice the size. Lazy, because the
                footer is below the fold on every page. */}
            <Image
              src="/images/logo.png"
              alt=""
              width={112}
              height={112}
              sizes="112px"
              className="h-20 w-auto shrink-0 lg:h-28"
            />
            <span
              aria-hidden="true"
              className="text-caption leading-[1.45] font-medium tracking-[0.18em] text-graphite uppercase lg:text-small"
            >
              Indonesia
              <br />
              Wristwatch
              <br />
              Museum
            </span>
          </Link>

          <div className="flex flex-col gap-12 sm:flex-row sm:gap-20">
            <nav aria-label="Footer">
              <h2 className="eyebrow">Museum</h2>
              {/* Each link is its own 44px row rather than an 18px line with a
                  gap between: measured at 375px these were 38x18 targets,
                  under the minimum for a thumb. The pitch replaces the gap,
                  so the column reads the same and is a third taller. */}
              <ul className="mt-3 flex flex-col">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-11 items-center text-small text-slate transition-colors duration-fast hover:text-graphite"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {links.length > 0 && (
              <div>
                <h2 className="eyebrow">Elsewhere</h2>
                <ul className="mt-5 flex flex-wrap items-center gap-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <SocialCard link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 border-t border-border-grey pt-8 lg:mt-24">
          <p className="text-caption tracking-caption text-slate uppercase">
            © {year} {siteName}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
