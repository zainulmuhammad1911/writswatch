"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True only once an IntersectionObserver has actually reported the element as
 * off screen.
 *
 * Used to pause the two expensive infinite animations on the homepage — the
 * cylinder carousel and the perspective grid — while nobody can see them.
 *
 * The direction of the default is the whole point. framer-motion's `useInView`
 * starts `false` and becomes `true` once the observer reports, which would mean
 * pausing first and running later: an animation that stays frozen for as long
 * as the observer has not spoken. That is fine in a healthy tab and wrong
 * everywhere else. With JavaScript disabled, or after a hydration failure, or
 * in the Claude Code preview pane — which reports
 * `document.visibilityState === "hidden"` and so never fires
 * IntersectionObserver at all — the animation would never start. Before any of
 * this it ran from first paint with no JavaScript involved, and that should
 * stay true.
 *
 * So this hook reports "off screen" only as a positive observation. Nothing
 * observed yet, no observer available, no element: false, and the caller
 * leaves `animation-play-state` alone, which means the CSS default of running.
 *
 * `margin` is a rootMargin, so the animation resumes slightly before the
 * element scrolls back into view and there is no visible catch-up.
 */
export function useIsOffScreen(
  ref: RefObject<Element | null>,
  margin = "300px"
): boolean {
  const [offScreen, setOffScreen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setOffScreen(!entry.isIntersecting);
      },
      { rootMargin: margin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, margin]);

  return offScreen;
}
