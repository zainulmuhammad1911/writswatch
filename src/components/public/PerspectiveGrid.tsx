"use client";

import React, { useMemo, useRef, useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";
import { useIsOffScreen } from "@/hooks/useIsOffScreen";
import { cn } from "@/lib/utils";

/** The grid never changes after hydration, so there is nothing to subscribe to. */
const subscribeToNothing = () => () => {};

interface PerspectiveGridProps {
  className?: string;
  gridSize?: number;
  showOverlay?: boolean;
  fadeRadius?: number;
  /** Set false to hold the grid still even when motion is allowed. */
  animated?: boolean;
}

export function PerspectiveGrid({
  className,
  gridSize = 40,
  showOverlay = true,
  fadeRadius = 80,
  animated = true,
}: PerspectiveGridProps) {
  // The grid is a client-only decoration; rendering it on the server would ship
  // 1,600 empty divs in the HTML payload for no benefit. useSyncExternalStore
  // reports false on the server and true after hydration without the cascading
  // render a setState-in-effect would cause.
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
  const prefersReducedMotion = useReducedMotion();
  const drift = animated && !prefersReducedMotion;

  /**
   * The drift is paused whenever the grid is off screen. See the longer note in
   * CylinderCarousel; the same reasoning applies, and the numbers here are
   * worse. This element measures 2225 x 661 on a desktop viewport, carries
   * `scale(2)` so it rasterises at roughly four times that, sits under
   * `transform-style: preserve-3d`, and holds 1,600 tile divs that each own a
   * colour transition. Animating a 3D transform on that for the entire visit,
   * long after the hero has scrolled away, was the larger half of the jank
   * reported on Windows.
   *
   * `useIsOffScreen`, not framer-motion's `useInView`, because the default has
   * to be "running". See the note in that hook.
   */
  const gridRef = useRef<HTMLDivElement>(null);
  const offScreen = useIsOffScreen(gridRef);

  const tiles = useMemo(
    () => Array.from({ length: gridSize * gridSize }),
    [gridSize]
  );

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative h-full w-full overflow-hidden bg-cool-white",
        className
      )}
      ref={gridRef}
      style={{
        perspective: "2000px",
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="absolute grid aspect-square w-[80rem] origin-center"
        style={{
          left: "50%",
          top: "50%",
          // The static transform is the keyframes' own 0% state, so the grid
          // sits in the right place whether or not the drift is running.
          transform:
            "translate(-50%, -50%) rotateX(30deg) rotateY(-5deg) rotateZ(20deg) scale(2)",
          transformStyle: "preserve-3d",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          animation: drift
            ? "iwm-grid-drift 32s ease-in-out infinite"
            : undefined,
          animationPlayState: offScreen ? "paused" : undefined,
        }}
      >
        {mounted &&
          tiles.map((_, i) => (
            // A tile lights up the instant the cursor touches it, then takes
            // 1.5s to fade back. Moving across the grid therefore leaves a
            // trail that dissolves behind the pointer.
            <div
              key={i}
              className="min-h-px min-w-px border border-border-grey bg-transparent transition-colors duration-[1500ms] hover:bg-navy/12 hover:duration-0"
            />
          ))}
      </div>

      {showOverlay && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: `radial-gradient(circle, transparent 25%, var(--color-cool-white) ${fadeRadius}%)`,
          }}
        />
      )}
    </div>
  );
}

export default PerspectiveGrid;
