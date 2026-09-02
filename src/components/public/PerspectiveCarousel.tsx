"use client";

import * as React from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PerspectiveCarouselItem {
  src: string;
  title: string;
  alt?: string;
  slug?: string;
}

export interface PerspectiveCarouselProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: PerspectiveCarouselItem[];
  activeIndex?: number;
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onItemClick?: (item: PerspectiveCarouselItem, index: number) => void;
  loop?: boolean;
  slideWidth?: number;
  rotationStep?: number;
  inactiveScale?: number;
  transition?: Transition;
  showControls?: boolean;
  showDots?: boolean;
  viewportClassName?: string;
  slideClassName?: string;
  imageClassName?: string;
  labelClassName?: string;
  controlsClassName?: string;
}

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  bounce: 0.14,
  duration: 0.9,
};

const REDUCED_TRANSITION: Transition = { duration: 0 };

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function PerspectiveCarousel({
  items,
  activeIndex,
  defaultActiveIndex = 0,
  onActiveIndexChange,
  onItemClick,
  loop = false,
  slideWidth = 260,
  rotationStep = 60,
  inactiveScale = 0.85,
  transition,
  showControls = true,
  showDots = true,
  viewportClassName,
  slideClassName,
  imageClassName,
  labelClassName,
  controlsClassName,
  className,
  onKeyDown,
  tabIndex,
  ...props
}: PerspectiveCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const resolvedTransition =
    transition ??
    (prefersReducedMotion ? REDUCED_TRANSITION : DEFAULT_TRANSITION);

  const maxIndex = Math.max(0, items.length - 1);
  const [uncontrolledIndex, setUncontrolledIndex] = React.useState(() =>
    clamp(defaultActiveIndex, 0, maxIndex)
  );
  const currentIndex = clamp(activeIndex ?? uncontrolledIndex, 0, maxIndex);
  const safeSlideWidth = Math.max(96, slideWidth);
  const safeInactiveScale = clamp(inactiveScale, 0.5, 1);

  const selectSlide = React.useCallback(
    (nextIndex: number) => {
      if (!items.length) return;
      const resolvedIndex = loop
        ? (nextIndex + items.length) % items.length
        : clamp(nextIndex, 0, maxIndex);
      if (activeIndex === undefined) setUncontrolledIndex(resolvedIndex);
      onActiveIndexChange?.(resolvedIndex);
    },
    [activeIndex, items.length, loop, maxIndex, onActiveIndexChange]
  );

  if (!items.length) return null;

  const isPreviousDisabled = !loop && currentIndex === 0;
  const isNextDisabled = !loop && currentIndex === maxIndex;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectSlide(currentIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectSlide(currentIndex + 1);
    }
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured timepieces carousel"
      tabIndex={tabIndex ?? 0}
      onKeyDown={handleKeyDown}
      className={cn("relative isolate h-full w-full overflow-hidden", className)}
      {...props}
    >
      <div
        className={cn("absolute inset-0 overflow-hidden", viewportClassName)}
        style={{ perspective: "1200px" }}
      >
        <motion.div
          className="absolute top-1/2 left-1/2 flex w-fit -translate-y-1/2 items-center"
          animate={{
            x: -(currentIndex * safeSlideWidth + safeSlideWidth / 2),
          }}
          transition={resolvedTransition}
        >
          {items.map((item, index) => {
            const isActive = currentIndex === index;
            return (
              <div
                key={`${item.src}-${index}`}
                className="shrink-0"
                style={{ width: safeSlideWidth, perspective: "1200px" }}
              >
                <motion.div
                  className={cn(
                    "flex w-full flex-col items-center gap-3 will-change-transform",
                    slideClassName
                  )}
                  animate={{
                    rotateY: (currentIndex - index) * rotationStep,
                    scale: isActive ? 1 : safeInactiveScale,
                  }}
                  transition={resolvedTransition}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <button
                    type="button"
                    aria-label={
                      isActive ? `View ${item.title}` : `Show ${item.title}`
                    }
                    aria-current={isActive ? "true" : undefined}
                    // Only the active slide is a navigation target; the others
                    // are reachable but stay out of the tab order so the
                    // carousel does not swallow six stops.
                    tabIndex={isActive ? 0 : -1}
                    className="aspect-[3/4] w-full cursor-pointer rounded-md"
                    onClick={() => {
                      if (isActive && onItemClick) {
                        onItemClick(item, index);
                      } else {
                        selectSlide(index);
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element --
                        the slide is inside a 3D-transformed, spring-animated
                        stack that next/image cannot lay out. */}
                    <img
                      src={item.src}
                      alt={item.alt ?? item.title}
                      draggable={false}
                      className={cn(
                        "h-full w-full rounded-md object-cover shadow-float select-none",
                        imageClassName
                      )}
                    />
                  </button>
                  <motion.p
                    className={cn(
                      "text-small font-medium whitespace-nowrap text-graphite",
                      labelClassName
                    )}
                    animate={{
                      filter: isActive ? "blur(0px)" : "blur(2px)",
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={resolvedTransition}
                  >
                    {item.title}
                  </motion.p>
                </motion.div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {showControls && (
        <div
          className={cn(
            "absolute inset-x-4 bottom-5 z-10 mx-auto flex w-fit items-center justify-center gap-3 rounded-full border border-border-grey bg-pure-white/70 px-2 text-graphite shadow-surface backdrop-blur-sm",
            controlsClassName
          )}
        >
          <button
            type="button"
            aria-label="Show previous slide"
            disabled={isPreviousDisabled}
            className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-soft-grey disabled:cursor-not-allowed disabled:opacity-35"
            onClick={() => selectSlide(currentIndex - 1)}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          {showDots && (
            <div className="flex items-center justify-center gap-2">
              {items.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  aria-label={`Show slide ${index + 1}: ${item.title}`}
                  aria-current={currentIndex === index ? "true" : undefined}
                  className={cn(
                    "h-2 rounded-full transition-[width,opacity] duration-300",
                    currentIndex === index
                      ? "w-7 bg-navy opacity-100"
                      : "w-2 bg-slate opacity-30"
                  )}
                  onClick={() => selectSlide(index)}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            aria-label="Show next slide"
            disabled={isNextDisabled}
            className="inline-flex size-9 items-center justify-center rounded-full transition-colors hover:bg-soft-grey disabled:cursor-not-allowed disabled:opacity-35"
            onClick={() => selectSlide(currentIndex + 1)}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export default PerspectiveCarousel;
