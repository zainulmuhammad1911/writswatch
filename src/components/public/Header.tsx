"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { animate, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { GooeySearch } from "@/components/public/GooeySearch";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
}

/** Put this id on a hero section to make the header transparent over it. */
export const HERO_SENTINEL_ID = "hero";

/** Matches --spacing-header-lg in globals.css. */
const HEADER_HEIGHT_PX = 96;

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Collection", href: "/collection" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
];

/**
 * `/collection/submariner-5513` should still light up "Collection".
 *
 * Returns -1 when the path belongs to no nav item, which is what happens on a
 * 404. Falling back to Home there marks the current page `aria-current="page"`
 * on a link that does not lead to it, and tells a screen reader the error page
 * is the homepage.
 */
export function getActiveIndex(pathname: string, items: NavItem[]): number {
  const index = items.findIndex(
    (item) => item.href !== "/" && pathname.startsWith(item.href)
  );
  if (index !== -1) return index;
  return pathname === "/" ? items.findIndex((item) => item.href === "/") : -1;
}

/* -------------------------------------------------------------------------- */
/*  SpotlightNavbar                                                           */
/* -------------------------------------------------------------------------- */

export interface SpotlightNavbarProps {
  items?: NavItem[];
  className?: string;
  activeIndex: number;
}

/**
 * The nav pill. A soft spotlight follows the cursor across the bar, and a
 * two-pixel "ambience" bead sits under whichever route is active, sliding when
 * the route changes.
 */
export function SpotlightNavbar({
  items = NAV_ITEMS,
  className,
  activeIndex,
}: SpotlightNavbarProps) {
  const navRef = useRef<HTMLElement>(null);
  const [hovering, setHovering] = useState(false);
  const spotlightX = useRef(0);
  const ambienceX = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const centerOfActiveItem = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return null;
    const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);
    if (!activeItem) return null;
    const navRect = nav.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    return itemRect.left - navRect.left + itemRect.width / 2;
  }, [activeIndex]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = nav.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHovering(true);
      spotlightX.current = x;
      nav.style.setProperty("--spotlight-x", `${x}px`);
    };

    const handleMouseLeave = () => {
      setHovering(false);
      const targetX = centerOfActiveItem();
      if (targetX === null) return;
      if (prefersReducedMotion) {
        spotlightX.current = targetX;
        nav.style.setProperty("--spotlight-x", `${targetX}px`);
        return;
      }
      animate(spotlightX.current, targetX, {
        type: "spring",
        stiffness: 200,
        damping: 20,
        onUpdate: (v) => {
          spotlightX.current = v;
          nav.style.setProperty("--spotlight-x", `${v}px`);
        },
      });
    };

    nav.addEventListener("mousemove", handleMouseMove);
    nav.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      nav.removeEventListener("mousemove", handleMouseMove);
      nav.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [centerOfActiveItem, prefersReducedMotion]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const place = (animated: boolean) => {
      const targetX = centerOfActiveItem();
      // Zero while the pill is display:none below 1024px, or before the fonts
      // have settled. Wait for a real measurement rather than parking the bead
      // at the left edge.
      if (targetX === null || targetX === 0) return;
      if (!animated || prefersReducedMotion) {
        ambienceX.current = targetX;
        nav.style.setProperty("--ambience-x", `${targetX}px`);
        return;
      }
      animate(ambienceX.current, targetX, {
        type: "spring",
        stiffness: 200,
        damping: 20,
        onUpdate: (v) => {
          ambienceX.current = v;
          nav.style.setProperty("--ambience-x", `${v}px`);
        },
      });
    };

    place(true);

    // Re-measure when the pill appears at the lg breakpoint, when the window
    // resizes, and when the webfont swap changes the label widths.
    const observer = new ResizeObserver(() => place(false));
    observer.observe(nav);
    return () => observer.disconnect();
  }, [centerOfActiveItem, prefersReducedMotion]);

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className={cn(
        "relative h-13 overflow-hidden rounded-full border border-border-grey bg-pure-white/80 shadow-surface backdrop-blur-sm transition-all duration-base",
        className
      )}
      style={
        {
          "--spotlight-color": "rgba(22, 43, 61, 0.08)",
          "--ambience-color": "rgba(22, 43, 61, 0.9)",
        } as React.CSSProperties
      }
    >
      <ul className="relative z-10 flex h-full items-center gap-0 px-2.5">
        {items.map((item, idx) => (
          <li key={item.href} className="relative flex h-full items-center justify-center">
            <Link
              href={item.href}
              data-index={idx}
              aria-current={activeIndex === idx ? "page" : undefined}
              className={cn(
                "rounded-full px-5 py-2.5 text-body font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-navy/30 focus-visible:outline-none",
                activeIndex === idx
                  ? "text-graphite"
                  : "text-slate hover:text-graphite"
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-[1] h-full w-full transition-opacity duration-300"
        style={{
          opacity: hovering ? 1 : 0,
          background:
            "radial-gradient(120px circle at var(--spotlight-x) 100%, var(--spotlight-color) 0%, transparent 50%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-[2] h-[2px] w-full"
        style={{
          background:
            "radial-gradient(60px circle at var(--ambience-x) 0%, var(--ambience-color) 0%, transparent 100%)",
        }}
      />
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Wordmark                                                                  */
/* -------------------------------------------------------------------------- */

function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Indonesia Wristwatch Museum — home"
      className={cn(
        "group flex shrink-0 items-center gap-3.5 rounded-sm focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4 focus-visible:ring-offset-cool-white focus-visible:outline-none",
        className
      )}
    >
      {/* Through next/image, which is not decoration here: the source PNG is
          277KB and the mark renders at 44-56px. Optimised it is a couple of
          kilobytes of AVIF, and it is in the header of every page. */}
      <Image
        src="/images/logo.png"
        alt=""
        width={56}
        height={56}
        sizes="56px"
        priority
        className="h-11 w-auto shrink-0 lg:h-14"
      />
      <span
        aria-hidden="true"
        className="hidden text-[0.6875rem] leading-[1.35] font-medium tracking-[0.18em] text-graphite uppercase sm:block lg:text-caption"
      >
        Indonesia
        <br />
        Wristwatch
        <br />
        Museum
      </span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                    */
/* -------------------------------------------------------------------------- */

export interface SearchEntry {
  /** What the visitor sees and types against, e.g. "Rolex Oyster Perpetual". */
  label: string;
  /** Where choosing it goes, e.g. "/collection/rolex-oyster-perpetual-1002". */
  href: string;
}

export interface HeaderProps {
  items?: NavItem[];
  searchItems?: SearchEntry[];
  /**
   * True on pages that open with a full-bleed hero: the bar starts transparent
   * and turns solid on scroll. Elsewhere it is solid from the first paint.
   */
  transparentOnTop?: boolean;
  className?: string;
}

export function Header({
  items = NAV_ITEMS,
  searchItems = [],
  transparentOnTop = false,
  className,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeIndex = getActiveIndex(pathname, items);
  const [scrolled, setScrolled] = useState(false);

  // The panel is stored alongside the route it was opened on, so a navigation
  // — from a link, or from the browser's back button — closes it without an
  // effect that would re-render the header a second time.
  const [menu, setMenu] = useState({ open: false, path: pathname });
  const menuOpen = menu.open && menu.path === pathname;
  const setMenuOpen = useCallback(
    (open: boolean) => setMenu({ open, path: pathname }),
    [pathname]
  );

  useEffect(() => {
    // On a hero-led page the bar should stay transparent for as long as the
    // hero is behind it, so watch the hero itself rather than a fixed pixel
    // offset. rootMargin pulls the observer's top edge down by the height of
    // the bar, so the switch happens exactly as the hero clears it.
    const hero = transparentOnTop
      ? document.getElementById(HERO_SENTINEL_ID)
      : null;

    if (hero) {
      const observer = new IntersectionObserver(
        ([entry]) => setScrolled(!entry.isIntersecting),
        { rootMargin: `-${HEADER_HEIGHT_PX}px 0px 0px 0px`, threshold: 0 }
      );
      observer.observe(hero);
      return () => observer.disconnect();
    }

    // Pages without a hero (or without JS layout yet) fall back to a plain
    // scroll threshold.
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparentOnTop]);

  // A fixed panel over the page should not leave the page scrolling behind it,
  // and Escape should close it.
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, setMenuOpen]);

  const solid = scrolled || !transparentOnTop || menuOpen;

  const searchLabels = useMemo(
    () => searchItems.map((entry) => entry.label),
    [searchItems]
  );

  const handleSearchSelect = (label: string) => {
    const match = searchItems.find((entry) => entry.label === label);
    router.push(match ? match.href : `/collection?q=${encodeURIComponent(label)}`);
  };

  return (
    <header
      /**
       * No backdrop-filter here, deliberately.
       *
       * This used to carry `backdrop-blur-md` once scrolled, and
       * `backdrop-filter` sat in the transition list as well. A `fixed`
       * element spanning the viewport means the compositor re-reads the strip
       * of page behind the bar and blurs it again on every scroll frame, and
       * transitioning the filter makes it recompute the blur repeatedly while
       * the transition runs. It is close to free on Apple silicon and expensive
       * on Windows, where Chrome reaches the GPU through ANGLE and Direct3D.
       *
       * The background is 90% opaque, so the blur was only ever smearing the
       * remaining 10%. Dropping it costs almost nothing to look at and removes
       * a per-frame cost from every scroll on the site. The nav pill keeps its
       * own `backdrop-blur-sm`: that one is a few hundred pixels wide rather
       * than viewport-wide, and its background is lighter at 80%, so it earns
       * the blur where this did not.
       */
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-base ease-out-museum",
        solid
          ? "border-b border-border-grey bg-cool-white/90"
          : "border-b border-transparent bg-transparent",
        className
      )}
    >
      <div className="shell flex h-header items-center gap-6 lg:h-header-lg lg:gap-10">
        <Wordmark />

        <SpotlightNavbar
          items={items}
          activeIndex={activeIndex}
          className="hidden lg:block"
        />

        {/* Pushes the search pill to the far right, leaving the wordmark and
            nav grouped together on the left. */}
        <div className="ml-auto flex items-center gap-4">
          <GooeySearch
            items={searchLabels}
            onSelect={handleSearchSelect}
            buttonLabel="Search"
            className="hidden lg:inline-flex"
          />

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-graphite transition-colors duration-fast hover:bg-soft-grey lg:hidden"
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-nav"
        hidden={!menuOpen}
        className="border-t border-border-grey bg-cool-white lg:hidden"
      >
        <nav aria-label="Primary" className="shell py-6">
          <ul className="flex flex-col">
            {items.map((item, idx) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={activeIndex === idx ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center border-b border-border-grey text-h3 transition-colors duration-fast",
                    activeIndex === idx ? "text-navy" : "text-graphite"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="pt-8">
            <GooeySearch
              items={searchLabels}
              onSelect={handleSearchSelect}
              buttonLabel="Search"
            />
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
