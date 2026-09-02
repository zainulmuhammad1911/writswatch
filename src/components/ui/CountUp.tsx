"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";

/**
 * Splits a display value into the parts worth counting.
 *
 *   "1000+"      -> prefix "",  numbers [1000],       suffix "+"
 *   "50+"        -> prefix "",  numbers [50],         suffix "+"
 *   "1900–2000"  -> prefix "",  numbers [1900, 2000], joiner "–"
 *
 * Anything it cannot parse comes back with no numbers and renders as-is.
 */
function parseValue(value: string) {
  const range = value.match(/^(\d+)\s*([–-])\s*(\d+)$/);
  if (range) {
    // range[2] is the dash itself; the second number is range[3].
    return {
      numbers: [Number(range[1]), Number(range[3])],
      joiner: range[2],
      suffix: "",
    };
  }
  const single = value.match(/^(\d+)(.*)$/);
  if (single) {
    return { numbers: [Number(single[1])], joiner: "", suffix: single[2] };
  }
  return { numbers: [] as number[], joiner: "", suffix: value };
}

export interface CountUpProps {
  /** The final display value, e.g. "1000+" or "1900–2000". */
  value: string;
  /** Seconds. */
  duration?: number;
  className?: string;
}

/**
 * Counts up to the value the first time it scrolls into view, then stops.
 *
 * Years count from a nearby floor rather than from zero, because watching a
 * date climb from 0 to 1900 looks like a loading bar, not a date.
 */
export function CountUp({ value, duration = 1.6, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const prefersReducedMotion = useReducedMotion();
  const parsed = useMemo(() => parseValue(value), [value]);

  // Starts at the finished value so the figure is never missing: if the
  // observer never fires, the reader still sees the real number. The element
  // begins below the fold in practice, so the swap to the counting floor
  // happens off-screen.
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || prefersReducedMotion || !parsed.numbers.length) return;

    const targets = parsed.numbers;
    // A four-digit number is a year: start 40 below it so the digits move
    // without the value being nonsense on the way up.
    const from = targets.map((n) => (n >= 1000 && n <= 2999 ? n - 40 : 0));
    const current = [...from];

    const controls = targets.map((target, i) =>
      animate(from[i], target, {
        duration,
        ease: ease.out,
        onUpdate: (latest) => {
          current[i] = latest;
          setDisplay(
            current.map((n) => Math.round(n)).join(parsed.joiner) + parsed.suffix
          );
        },
      })
    );

    return () => controls.forEach((c) => c.stop());
  }, [inView, prefersReducedMotion, duration, parsed]);

  return (
    <span ref={ref} data-numeric className={className}>
      {display}
    </span>
  );
}

export default CountUp;
