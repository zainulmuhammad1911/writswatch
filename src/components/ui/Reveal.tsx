"use client";

import { motion, useReducedMotion } from "framer-motion";
import { duration, ease, revealViewport } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds. Use small offsets to stagger siblings. */
  delay?: number;
  /** Pixels the block travels upward. Set to 0 for a plain fade. */
  distance?: number;
  as?: "div" | "section" | "li" | "article";
}

/**
 * Fade-up on first scroll into view. Fires once and never replays, which keeps
 * the page calm when someone scrolls back up.
 *
 * Under prefers-reduced-motion the content is simply there: no offset, no fade.
 * Framer's whileInView would otherwise still animate opacity.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 24,
  as = "div",
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const Component = motion[as];

  if (prefersReducedMotion) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Component
      // Framer serialises the hidden initial state into the SSR HTML, so
      // without JS this content would never appear. The noscript rule in the
      // root layout targets this attribute and forces it visible.
      data-reveal=""
      className={cn(className)}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={{ duration: duration.slow, ease: ease.out, delay }}
    >
      {children}
    </Component>
  );
}

export default Reveal;
