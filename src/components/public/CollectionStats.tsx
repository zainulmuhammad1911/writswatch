"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CountUp } from "@/components/ui/CountUp";
import { duration, ease, revealViewport } from "@/lib/motion";
import type { Statistic } from "@/types";

export interface CollectionStatsProps {
  stats: Statistic[];
}

/**
 * The three figures, stacked as cards beside the section headline.
 *
 * Each card slides in from the right on a stagger, and its figure counts up
 * once as it arrives. The rule above each figure draws itself across the card
 * on the same beat, which is what ties the three together as a set.
 */
export function CollectionStats({ stats }: CollectionStatsProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    // overflow-x-clip: each card starts 32px to the right, which would
    // otherwise widen the document and give the whole page a horizontal
    // scrollbar until the animation finishes.
    <ul className="flex flex-col overflow-x-clip">
      {stats.map((stat, index) => (
        <motion.li
          key={stat.label}
          data-reveal=""
          className="group relative"
          initial={
            prefersReducedMotion ? undefined : { opacity: 0, x: 32 }
          }
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={revealViewport}
          transition={{
            duration: duration.slow,
            ease: ease.out,
            delay: index * 0.12,
          }}
        >
          <div className="relative overflow-hidden py-8 transition-colors duration-base ease-out-museum group-hover:bg-pure-white lg:px-8">
            {/* The rule wipes in from the left as the card arrives. */}
            <motion.span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px origin-left bg-border-grey lg:inset-x-8"
              initial={prefersReducedMotion ? undefined : { scaleX: 0 }}
              whileInView={prefersReducedMotion ? undefined : { scaleX: 1 }}
              viewport={revealViewport}
              transition={{
                duration: duration.slow,
                ease: ease.out,
                delay: index * 0.12 + 0.1,
              }}
            />
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 h-px w-0 bg-navy transition-[width] duration-slow ease-out-museum group-hover:w-full motion-reduce:transition-none lg:left-8"
            />

            <div className="flex items-baseline gap-4">
              <span className="text-caption tracking-caption text-slate tabular-nums">
                0{index + 1}
              </span>
              <CountUp
                value={stat.value}
                className="font-display text-h1 leading-none text-graphite"
              />
            </div>
            <p className="mt-4 text-small text-slate transition-colors duration-base group-hover:text-graphite">
              {stat.label}
            </p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

export default CollectionStats;
