"use client";

import { useRouter } from "next/navigation";
import {
  PerspectiveCarousel,
  type PerspectiveCarouselItem,
} from "@/components/public/PerspectiveCarousel";

export interface FeaturedTimepiecesProps {
  items: PerspectiveCarouselItem[];
}

/**
 * Homepage wrapper around PerspectiveCarousel. The page itself is a server
 * component, so the click-to-navigate handler lives here.
 *
 * No background of its own: the carousel sits on the same cool white as the
 * rest of the page so the section reads as one continuous surface.
 */
export function FeaturedTimepieces({ items }: FeaturedTimepiecesProps) {
  const router = useRouter();

  return (
    <div className="h-[460px] w-full sm:h-[540px] lg:h-[620px]">
      <PerspectiveCarousel
        items={items}
        loop
        // Open on a middle slide so there are photographs on both sides of the
        // active one. Starting at 0 leaves the whole left half of the band empty.
        defaultActiveIndex={Math.floor((items.length - 1) / 2)}
        slideWidth={220}
        onItemClick={(item) => {
          if (item.slug) router.push(`/collection/${item.slug}`);
        }}
        className="mx-auto max-w-wide"
      />
    </div>
  );
}

export default FeaturedTimepieces;
