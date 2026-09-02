"use client";

import React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CarouselImage {
  src: string;
  alt?: string;
}

export interface CylinderCarouselProps
  extends React.HTMLAttributes<HTMLDivElement> {
  images: CarouselImage[];
  containerClassName?: string;
  cardClassName?: string;
  animationDuration?: number;
  cardWidth?: number;
  /**
   * How far in from each edge the side fade starts, as a percentage. Small
   * values let the cylinder run out to the edges of the screen; large values
   * pull it into a narrow band in the middle.
   */
  fadeInset?: number;
  /** Extra gap between neighbouring cards, in em. Widens the cylinder. */
  cardGap?: number;
}

export const CylinderCarousel = React.forwardRef<
  HTMLDivElement,
  CylinderCarouselProps
>(
  (
    {
      images,
      className,
      containerClassName,
      cardClassName,
      animationDuration = 32,
      cardWidth = 280,
      fadeInset = 6,
      cardGap = 0.5,
      ...props
    },
    ref
  ) => {
    // A continuous rotation is the one memorable effect on the homepage, but it
    // is also exactly the kind of motion that makes some people ill. CSS alone
    // cannot fix it here: the animation is set inline, so the global
    // prefers-reduced-motion rule in globals.css cannot reach it. Slowing the
    // cylinder to a near-standstill keeps the composition intact while removing
    // the movement.
    const prefersReducedMotion = useReducedMotion();
    const duration = prefersReducedMotion ? 0 : animationDuration;

    const N = images.length;
    const customStyle = {
      "--n": N,
      "--w": `${cardWidth}px`,
      "--gap": `${cardGap}em`,
      "--ba": `calc(1turn / var(--n))`,
      "--anim-dur": `${duration}s`,
    } as React.CSSProperties;

    // The cylinder's radius is derived from the card width, the gap and the
    // angle between cards, so adding images widens it on its own: more cards
    // means a smaller angle, which means a bigger circle.
    const mask = `linear-gradient(90deg, transparent, #000 ${fadeInset}% ${100 - fadeInset}%, transparent)`;

    return (
      <div
        ref={ref}
        className={cn(
          "grid h-full min-h-[500px] w-full place-items-center overflow-hidden",
          className
        )}
        style={{
          perspective: "70em",
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
        {...props}
      >
        <div
          className={cn(
            "grid place-items-center [transform-style:preserve-3d]",
            containerClassName
          )}
          style={{
            ...customStyle,
            animation: prefersReducedMotion
              ? undefined
              : "iwm-cylinder-spin var(--anim-dur) linear infinite",
          }}
        >
          {images.map((img, i) => (
            // next/image cannot be measured inside a 3D-transformed grid
            // cell; these are hero assets served straight from /public.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.src}
              alt={img.alt || `Timepiece ${i + 1}`}
              draggable={false}
              className={cn(
                "rounded-md object-cover [backface-visibility:hidden] [grid-area:1/1]",
                cardClassName
              )}
              style={
                {
                  width: "var(--w)",
                  aspectRatio: "7/10",
                  "--i": i,
                  transform:
                    "rotateY(calc(var(--i) * var(--ba))) translateZ(calc(-1 * (0.5 * var(--w) + var(--gap)) / tan(0.5 * var(--ba))))",
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>
    );
  }
);

CylinderCarousel.displayName = "CylinderCarousel";

export default CylinderCarousel;
