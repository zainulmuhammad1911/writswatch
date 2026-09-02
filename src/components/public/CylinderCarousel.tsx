"use client";

import React from "react";
import Image from "next/image";
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

/**
 * Which cards are on screen before the cylinder has turned.
 *
 * Two groups, and the second one is not obvious. The cards either side of 0deg
 * are the ones facing the viewer. But the card at 180deg is translated toward
 * the camera rather than away from it, so perspective scales it up until it is
 * the largest box on the page — measured at 585,000px2 against 52,000px2 for
 * the front card. It is invisible (`backface-visibility: hidden`), and the
 * browser still nominated it as the Largest Contentful Paint element, which is
 * how a photograph nobody can see came to decide the homepage's LCP.
 *
 * Rather than guess, this was measured: at rest, exactly these indices have a
 * non-zero on-screen area. Everything else is 0 and stays lazy.
 */
function frontFacingIndices(count: number): Set<number> {
  if (count <= 6) return new Set(Array.from({ length: count }, (_, i) => i));
  return new Set([0, 1, 2, count - 1, count - 2, nearCameraIndex(count)]);
}

/**
 * The card the browser measures LCP against, per the note above.
 *
 * It gets `fetchPriority="high"` and the rest do not. Next passes the prop
 * through to both the `<img>` and the `rel=preload` it emits, and a preload
 * without it is queued at Low priority, so marking all six would only put
 * them back in a tie.
 */
function nearCameraIndex(count: number): number {
  return count <= 6 ? 0 : Math.round(count / 2);
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
    const onScreenAtRest = React.useMemo(
      () => frontFacingIndices(images.length),
      [images.length]
    );
    const lcpIndex = nearCameraIndex(images.length);
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
            /**
             * next/image, with explicit dimensions rather than `fill` — a
             * filled image needs a positioned parent it can be measured
             * against, which a 3D-transformed grid cell is not. The width and
             * height props are the intrinsic ratio; CSS still sizes the card.
             *
             * This matters more here than anywhere else on the site. The
             * source photographs are 1400x2000 and the cards render around
             * 300px wide, so served raw they were roughly five times the
             * pixels needed, fourteen times over, in the first viewport.
             * `sizes` is what tells Next which width to actually encode.
             */
            <Image
              key={i}
              src={img.src}
              alt={img.alt || `Timepiece ${i + 1}`}
              width={cardWidth}
              height={Math.round((cardWidth * 10) / 7)}
              sizes={`${cardWidth}px`}
              // Preloaded only if this card is actually on screen at the
              // animation's start angle. The rest stay lazy, which is what
              // keeps them out of the preload list: React 19 emits a
              // `rel=preload` for every non-lazy image it renders on the
              // server, so marking all fourteen eager put fourteen
              // high-priority image fetches in the head.
              priority={onScreenAtRest.has(i)}
              fetchPriority={i === lcpIndex ? "high" : undefined}
              draggable={false}
              className={cn(
                "rounded-md object-cover [backface-visibility:hidden] [grid-area:1/1]",
                cardClassName
              )}
              style={
                {
                  width: "var(--w)",
                  height: "auto",
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
