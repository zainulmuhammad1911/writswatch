import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only resolves conflicts between classes it recognises. The IWM
 * theme replaces Tailwind's default palette and type scale, so those scales are
 * registered here — otherwise `cn("text-h2", "text-slate")` would silently drop
 * the size, and `cn("bg-cool-white", "bg-navy")` would keep both.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "cool-white",
        "pure-white",
        "soft-grey",
        "graphite",
        "slate",
        "navy",
        "navy-dark",
        "border-grey",
        "success",
        "warning",
        "danger",
      ],
      text: ["display", "h1", "h2", "h3", "body", "small", "caption", "label"],
      font: ["display", "sans"],
      spacing: [
        "section-sm",
        "section",
        "section-lg",
        "section-xl",
        "gutter",
        "gutter-md",
        "gutter-lg",
      ],
      container: ["content", "narrow", "wide"],
      tracking: ["label", "caption"],
      radius: ["xs", "sm", "md"],
      shadow: ["surface", "raised", "float"],
      ease: ["museum", "out-museum", "in-museum"],
    },
    classGroups: {
      // Custom @utility classes from globals.css.
      duration: [{ duration: ["fast", "base", "slow"] }],
    },
  },
});

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 * The later class wins: cn("p-4", condition && "p-8") -> "p-8".
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
