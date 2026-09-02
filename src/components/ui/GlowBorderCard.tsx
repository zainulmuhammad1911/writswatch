"use client";

import React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GlowBorderCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** Seconds for one full rotation of the gradient. */
  animationDuration?: number;
  /** Five colours, blended into a conic gradient and back to the first. */
  gradientColors?: [string, string, string, string, string];
  /** Thickness of the glow ring. */
  borderWidth?: string;
  blurAmount?: string;
  /** Negative values push the glow outside the card. */
  inset?: string;
  borderRadius?: string;
  paused?: boolean;
}

/**
 * A rotating conic-gradient glow behind a card, adapted from VengeanceUI's
 * glow-border-card to the museum palette: navy through slate and back, rather
 * than the original aurora colours. It reads as a slow shift of light on a
 * frame, which is about as loud as this design should get.
 *
 * The animation is CSS-only (see the iwm-glow-spin keyframes and the
 * glow-conic utility in globals.css), so it costs nothing on the main thread.
 */
export const GlowBorderCard = React.forwardRef<
  HTMLDivElement,
  GlowBorderCardProps
>(
  (
    {
      children,
      className,
      animationDuration = 14,
      // Navy through the greys and back. On a light background a "glow" reads
      // as a travelling light-and-dark edge rather than a halo, so the stops
      // alternate between the darkest and lightest tokens to stay legible.
      gradientColors = ["#162B3D", "#D9DEE2", "#687078", "#D9DEE2", "#0D1E2B"],
      borderWidth = "0.28em",
      blurAmount = "0.22em",
      inset = "-0.3em",
      borderRadius = "0px",
      paused = false,
      style,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const colorVars = gradientColors.reduce<Record<string, string>>(
      (acc, color, i) => {
        acc[`--glow-color-${i + 1}`] = color;
        return acc;
      },
      {}
    );

    return (
      <div
        ref={ref}
        className={cn("relative isolate", className)}
        style={
          {
            borderRadius,
            "--glow-animation-duration": `${animationDuration}s`,
            ...colorVars,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        <div
          aria-hidden="true"
          className={cn(
            "glow-conic absolute -z-10 rounded-[inherit]",
            (paused || prefersReducedMotion) && "[animation-play-state:paused]"
          )}
          style={{
            inset,
            borderWidth,
            filter: `blur(${blurAmount})`,
          }}
        />
        <div className="relative z-10 h-full w-full rounded-[inherit]">
          {children}
        </div>
      </div>
    );
  }
);

GlowBorderCard.displayName = "GlowBorderCard";

export default GlowBorderCard;
