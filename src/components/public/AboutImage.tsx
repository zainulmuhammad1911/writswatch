"use client";

import Image from "next/image";
import { GlowBorderCard } from "@/components/ui/GlowBorderCard";
import { Reveal } from "@/components/ui/Reveal";

export interface AboutImageProps {
  src: string;
  alt: string;
}

/**
 * The macro dial photograph beside the About copy.
 *
 * Two animations, layered. `Reveal` fades the frame up on first scroll into
 * view, and the photograph itself eases out of a slight zoom via a CSS
 * keyframe. The glow border keeps turning after both are done.
 *
 * The zoom is deliberately CSS rather than scroll-triggered. An earlier version
 * clipped the photograph in from its bottom edge with Framer, and when that
 * animation did not fire the photograph stayed invisible: a decoration was
 * hiding the content. A CSS animation always runs to completion, and its end
 * state is the element's natural one, so the worst case here is a photograph
 * that appears without moving.
 */
export function AboutImage({ src, alt }: AboutImageProps) {
  return (
    <GlowBorderCard className="w-full">
      <Reveal>
        <div className="relative aspect-[4/5] w-full overflow-hidden border border-border-grey bg-soft-grey">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover [animation:iwm-image-settle_1.4s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:[animation:none]"
          />
        </div>
      </Reveal>
    </GlowBorderCard>
  );
}

export default AboutImage;
