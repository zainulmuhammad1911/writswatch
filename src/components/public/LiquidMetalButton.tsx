"use client";

import React, { forwardRef, memo } from "react";
import Link from "next/link";
import { LiquidMetal as LiquidMetalShader } from "@paper-design/shaders-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LiquidMetalProps {
  colorBack?: string;
  colorTint?: string;
  speed?: number;
  repetition?: number;
  distortion?: number;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const LiquidMetal = memo(function LiquidMetal({
  colorBack = "#162B3D",
  colorTint = "#ffffff",
  speed = 0.5,
  repetition = 4,
  distortion = 0.1,
  scale = 1,
  className,
  style,
}: LiquidMetalProps) {
  // A WebGL shader loop ignores CSS motion preferences, so it is stopped here.
  // speed 0 still paints the border — it simply stops moving.
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn("absolute inset-0 z-0 overflow-hidden", className)}
      style={style}
    >
      <LiquidMetalShader
        colorBack={colorBack}
        colorTint={colorTint}
        speed={prefersReducedMotion ? 0 : speed}
        repetition={repetition}
        distortion={distortion}
        softness={0}
        shiftRed={0.3}
        shiftBlue={-0.3}
        angle={45}
        shape="none"
        scale={scale}
        fit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
});

LiquidMetal.displayName = "LiquidMetal";

interface SurfaceProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  borderWidth: number;
  metalConfig?: Omit<LiquidMetalProps, "className" | "style">;
  size: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "py-2 pl-2 pr-6 gap-3 text-small",
  md: "py-3 pl-3 pr-8 gap-4 text-body",
  lg: "py-4 pl-4 pr-10 gap-6 text-h3",
} as const;

const iconSizes = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
} as const;

/** The shader ring plus the white pill. Shared by the button and link variants. */
function LiquidMetalSurface({
  children,
  icon,
  borderWidth,
  metalConfig,
  size,
}: SurfaceProps) {
  return (
    <div
      className="relative overflow-hidden rounded-full shadow-[0_20px_50px_-12px_rgba(23,26,29,0.25)]"
      style={{ padding: borderWidth }}
    >
      <LiquidMetal
        colorBack={metalConfig?.colorBack ?? "#162B3D"}
        colorTint={metalConfig?.colorTint ?? "#ffffff"}
        speed={metalConfig?.speed ?? 0.4}
        repetition={metalConfig?.repetition ?? 4}
        distortion={metalConfig?.distortion ?? 0.15}
        scale={metalConfig?.scale ?? 1}
        className="absolute inset-0 z-0 rounded-full"
      />

      <div
        className={cn(
          "relative z-10 flex items-center rounded-full bg-pure-white transition-colors duration-200 group-hover:bg-cool-white",
          sizeStyles[size]
        )}
      >
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-soft-grey shadow-[inset_0_2px_4px_rgba(23,26,29,0.06)]",
              iconSizes[size]
            )}
          >
            <span className="text-slate">{icon}</span>
          </div>
        )}
        <span className="font-medium tracking-tight text-graphite">
          {children}
        </span>
      </div>
    </div>
  );
}

const triggerClasses =
  "group relative cursor-pointer border-none bg-transparent p-0 outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4 focus-visible:ring-offset-cool-white rounded-full";

export interface LiquidMetalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  borderWidth?: number;
  metalConfig?: Omit<LiquidMetalProps, "className" | "style">;
  size?: "sm" | "md" | "lg";
}

export const LiquidMetalButton = forwardRef<
  HTMLButtonElement,
  LiquidMetalButtonProps
>(
  (
    {
      children,
      icon,
      borderWidth = 4,
      metalConfig,
      size = "md",
      className,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        triggerClasses,
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <LiquidMetalSurface
        icon={icon}
        borderWidth={borderWidth}
        metalConfig={metalConfig}
        size={size}
      >
        {children}
      </LiquidMetalSurface>
    </button>
  )
);

LiquidMetalButton.displayName = "LiquidMetalButton";

export interface LiquidMetalLinkProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "children"> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  borderWidth?: number;
  metalConfig?: Omit<LiquidMetalProps, "className" | "style">;
  size?: "sm" | "md" | "lg";
}

/**
 * Same surface, rendered as a real link. Use this whenever the CTA navigates,
 * so middle-click, open-in-new-tab and the status bar all behave normally.
 * Nesting a <button> inside an <a> would break every one of those.
 */
export function LiquidMetalLink({
  children,
  icon,
  borderWidth = 4,
  metalConfig,
  size = "md",
  className,
  ...props
}: LiquidMetalLinkProps) {
  return (
    <Link className={cn(triggerClasses, "inline-block", className)} {...props}>
      <LiquidMetalSurface
        icon={icon}
        borderWidth={borderWidth}
        metalConfig={metalConfig}
        size={size}
      >
        {children}
      </LiquidMetalSurface>
    </Link>
  );
}

export default LiquidMetalButton;
