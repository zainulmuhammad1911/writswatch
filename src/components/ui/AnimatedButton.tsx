"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SHINE_TRANSITION = {
  duration: 1,
  repeat: Infinity,
  ease: "linear" as const,
  repeatDelay: 2.5,
};

interface ShineProps {
  children: React.ReactNode;
  still: boolean;
}

/**
 * The label, masked by a highlight that sweeps across it, plus a matching
 * sweep along the border. Adapted from VengeanceUI's animated-button: the
 * original pulses every second in near-white, which is too insistent for a
 * museum, so this runs on a longer cycle in navy.
 */
function Shine({ children, still }: ShineProps) {
  if (still) {
    return (
      <span className="relative z-10 flex h-full w-full items-center justify-center gap-2">
        {children}
      </span>
    );
  }

  return (
    <>
      <motion.span
        className="relative z-10 flex h-full w-full items-center justify-center gap-2"
        style={{
          WebkitMaskImage:
            "linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))",
          maskImage:
            "linear-gradient(-75deg, white calc(var(--mask-x) + 20%), transparent calc(var(--mask-x) + 30%), white calc(var(--mask-x) + 100%))",
        }}
        initial={{ "--mask-x": "100%" } as never}
        animate={{ "--mask-x": "-100%" } as never}
        transition={SHINE_TRANSITION}
      >
        {children}
      </motion.span>

      <motion.span
        aria-hidden="true"
        className="absolute inset-0 block rounded-[inherit] p-px"
        style={{
          background:
            "linear-gradient(-75deg, transparent 30%, var(--shine) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
        }}
        initial={{ backgroundPosition: "100% 0", opacity: 0 }}
        animate={{ backgroundPosition: ["100% 0", "0% 0"], opacity: [0, 1, 0] }}
        transition={SHINE_TRANSITION}
      />
    </>
  );
}

const baseClasses =
  "group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-border-grey bg-pure-white px-7 py-3.5 text-small font-medium tracking-caption text-graphite uppercase transition-colors duration-base ease-out-museum hover:border-navy/40 hover:bg-cool-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4 focus-visible:ring-offset-cool-white focus-visible:outline-none [--shine:rgba(22,43,61,0.55)]";

export interface AnimatedLinkButtonProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "children"> {
  children: React.ReactNode;
}

/** Link variant. Use for anything that navigates. */
export function AnimatedLinkButton({
  children,
  className,
  ...props
}: AnimatedLinkButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <Link className={cn(baseClasses, className)} {...props}>
      <Shine still={!!prefersReducedMotion}>{children}</Shine>
    </Link>
  );
}

export interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

/** Button variant. Use for anything that acts on the current page. */
export function AnimatedButton({
  children,
  className,
  type = "button",
  ...props
}: AnimatedButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <button type={type} className={cn(baseClasses, className)} {...props}>
      <Shine still={!!prefersReducedMotion}>{children}</Shine>
    </button>
  );
}

export default AnimatedLinkButton;
