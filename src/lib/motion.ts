import type { Transition, Variants } from "framer-motion";

/**
 * Motion foundations.
 *
 * The museum is restrained: one memorable effect per page (the hero carousel),
 * everything else quiet. Section reveals fire once and never replay on scroll
 * back. Values mirror the --duration-* and --ease-* tokens in globals.css so
 * CSS transitions and Framer Motion share one rhythm.
 */

export const duration = {
  fast: 0.15,
  base: 0.3,
  slow: 0.6,
} as const;

/** cubic-bezier control points, matching --ease-*-museum. */
export const ease = {
  out: [0.22, 1, 0.36, 1],
  in: [0.64, 0, 0.78, 0],
  inOut: [0.4, 0, 0.2, 1],
} as const;

export const transition = {
  fast: { duration: duration.fast, ease: ease.out },
  base: { duration: duration.base, ease: ease.out },
  slow: { duration: duration.slow, ease: ease.out },
} satisfies Record<string, Transition>;

/** Subtle fade-up for section reveals. Pair with `viewport={revealViewport}`. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: ease.out },
  },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.slow, ease: ease.out } },
};

/**
 * Parent for staggered children (collection grids, stat rows).
 * 40ms per item — enough to read as a sequence, not slow enough to wait on.
 */
export const stagger = (staggerChildren = 0.04, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

/** Reveal once, when a third of the section has entered the viewport. */
export const revealViewport = { once: true, amount: 0.3 } as const;
