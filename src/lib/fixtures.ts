import { journalContent } from "@/content/journal";
import type { Article, ArchiveItem, Statistic, Timepiece } from "@/types";

/**
 * Static fixtures.
 *
 * Two jobs from Fase 7 onward:
 *   1. the source `prisma/seed.ts` loads into PostgreSQL
 *   2. what `lib/queries.ts` serves while DATABASE_URL is unset, so the site
 *      keeps rendering before the database exists
 *
 * Pages must not import this directly. They go through `lib/queries.ts`,
 * which is the only module that knows whether a database is present.
 *
 * Originally the mock content for Fase 1-6.
 *
 * ATTRIBUTION — nine of the twelve entries were read off the dial and are
 * reliable. Three are not: `tudor-submariner-snowflake-9411`,
 * `cartier-tank-louis-78086` and `heuer-autavia-2446` come from photographs
 * with no legible branding, so their brand, model, reference and year are
 * informed guesses written to fill the layout, not catalogue facts. Check those
 * three against the actual pieces before this goes public. Movement, case size
 * and material are unverified throughout.
 */

export const timepieces: Timepiece[] = [
  {
    id: "1",
    slug: "omega-seamaster-2846",
    brand: "Omega",
    model: "Seamaster",
    referenceNumber: "2846",
    year: 1956,
    movement: "Calibre 501, automatic",
    caseSize: "34mm",
    caseMaterial: "Stainless steel",
    dialColor: "Cream",
    category: "Dress",
    featured: true,
    description:
      "A steel Seamaster from the mid-fifties, with applied gold markers and a dial that has warmed to cream with age.",
    story:
      "Omega built the Seamaster as an everyday watch, and this one was worn like one. The dial has gone from silver to cream, unevenly, the way lacquer does over sixty years. Nothing on it has been touched.\n\nThe case still carries its original proportions, which is rarer than it sounds. Most watches of this age have been polished until the lugs go soft and the bevels disappear. These are sharp.",
    images: [
      { src: "/images/featured/1.jpg", alt: "Omega Seamaster, cream dial, brown leather strap", isPrimary: true },
      { src: "/images/collection/1a.jpg", alt: "Omega Seamaster, dial detail", isPrimary: false },
      { src: "/images/collection/1b.jpg", alt: "Omega Seamaster, case profile", isPrimary: false },
    ],
  },
  {
    id: "2",
    slug: "rolex-oyster-perpetual-1002",
    brand: "Rolex",
    model: "Oyster Perpetual",
    referenceNumber: "1002",
    year: 1968,
    movement: "Calibre 1570, automatic",
    caseSize: "34mm",
    caseMaterial: "Stainless steel",
    dialColor: "Silver",
    category: "Sports",
    featured: true,
    description:
      "The plainest Rolex there is, and the argument for it: a silver sunburst dial, a smooth bezel, and nothing else to look at.",
    story:
      "No date, no complication, no colour. The 1002 was the entry point to the Oyster line and it has outlasted most of what sat above it.\n\nWhat holds up is the dial, a fine sunburst that shifts from near white to grey as you turn it, and the way the smooth bezel keeps the whole watch quiet. The 1570 inside is the movement Rolex built its reputation on.",
    images: [
      { src: "/images/featured/2.jpg", alt: "Rolex Oyster Perpetual, silver dial, steel Oyster bracelet", isPrimary: true },
      { src: "/images/collection/2a.jpg", alt: "Rolex Oyster Perpetual, dial detail", isPrimary: false },
      { src: "/images/collection/2b.jpg", alt: "Rolex Oyster Perpetual, case profile", isPrimary: false },
    ],
  },
  {
    id: "3",
    slug: "seiko-cushion-6118",
    brand: "Seiko",
    model: "6118 Cushion",
    referenceNumber: "6118-8000",
    year: 1972,
    movement: "Calibre 6118, automatic",
    caseSize: "36mm",
    caseMaterial: "Stainless steel",
    dialColor: "Green",
    category: "Dress",
    featured: true,
    description:
      "A cushion case and a deep green dial, from the years when Seiko was designing without looking over its shoulder at Switzerland.",
    story:
      "Japanese watch design in the early seventies went somewhere Switzerland did not. The case is a cushion with wide brushed flanks, the crystal sits almost flush, and the dial is a green that darkens toward the edge.\n\nSeiko was finishing cases to a standard that embarrassed watches costing several times more. Look at where the brushed top meets the polished side: that line is dead straight.",
    images: [
      { src: "/images/featured/3.jpg", alt: "Seiko 6118 cushion case, green sunburst dial, black leather strap", isPrimary: true },
      { src: "/images/collection/3a.jpg", alt: "Seiko 6118 Cushion, dial detail", isPrimary: false },
      { src: "/images/collection/3b.jpg", alt: "Seiko 6118 Cushion, case profile", isPrimary: false },
    ],
  },
  {
    id: "4",
    slug: "tudor-submariner-snowflake-9411",
    brand: "Tudor",
    model: "Submariner “Snowflake”",
    referenceNumber: "9411/0",
    year: 1977,
    movement: "ETA 2784, automatic",
    caseSize: "40mm",
    caseMaterial: "Stainless steel",
    dialColor: "Blue",
    category: "Diver",
    featured: true,
    description:
      "The squared-off snowflake handset, a blue dial gone almost black, and lume aged to the colour of old paper.",
    story:
      "Tudor gave the Submariner its own handset in the late sixties, squared off at the tip, and it changed the whole face of the watch. Rolex never used it. The French navy ordered watches with it.\n\nThis example has kept its original bezel insert, faded unevenly toward the 50 mark. The lume plots have turned a warm ivory that no reissue has managed to copy honestly.",
    images: [
      { src: "/images/featured/4.jpg", alt: "Tudor Submariner with snowflake hands, blue dial, steel bracelet", isPrimary: true },
      { src: "/images/collection/4a.jpg", alt: "Tudor Submariner “Snowflake”, dial detail", isPrimary: false },
      { src: "/images/collection/4b.jpg", alt: "Tudor Submariner “Snowflake”, case profile", isPrimary: false },
    ],
  },
  {
    id: "5",
    slug: "cartier-tank-louis-78086",
    brand: "Cartier",
    model: "Tank Louis Cartier",
    referenceNumber: "78086",
    year: 1974,
    movement: "Manual wind",
    caseSize: "23mm × 30mm",
    caseMaterial: "18k yellow gold",
    dialColor: "Off-white",
    category: "Dress",
    featured: true,
    description:
      "Roman numerals, blued steel hands, a sapphire cabochon in the crown. The shape has not needed changing since 1917.",
    story:
      "Louis Cartier drew the Tank during the First World War and the outline has barely moved since. Gold case, railroad minute track, blued hands that read almost black until light catches them.\n\nIt is a small watch by any modern measure and it does not care. Put it next to a 42mm sports watch and the Tank is the one that looks considered.",
    images: [
      { src: "/images/featured/5.jpg", alt: "Cartier Tank in yellow gold, Roman numeral dial, black strap", isPrimary: true },
      { src: "/images/collection/5a.jpg", alt: "Cartier Tank Louis Cartier, dial detail", isPrimary: false },
      { src: "/images/collection/5b.jpg", alt: "Cartier Tank Louis Cartier, case profile", isPrimary: false },
    ],
  },
  {
    id: "6",
    slug: "heuer-autavia-2446",
    brand: "Heuer",
    model: "Autavia",
    referenceNumber: "2446",
    year: 1966,
    movement: "Valjoux 72, manual wind chronograph",
    caseSize: "39mm",
    caseMaterial: "Stainless steel",
    dialColor: "Silver with black registers",
    category: "Chronograph",
    featured: true,
    description:
      "A three-register chronograph with the tachymetre on a rotating bezel rather than the dial, on the perforated strap it came with.",
    story:
      "The Autavia was built for people driving and flying, which is where the name comes from. Putting the tachymetre on the bezel instead of the dial freed up the dial, and the result reads faster than any of its contemporaries.\n\nThe Valjoux 72 inside is the movement most of the great sixties chronographs were built around. The strap is original and looks it.",
    images: [
      { src: "/images/featured/6.jpg", alt: "Heuer Autavia chronograph, silver dial with black registers, perforated rally strap", isPrimary: true },
      { src: "/images/collection/6a.jpg", alt: "Heuer Autavia, dial detail", isPrimary: false },
      { src: "/images/collection/6b.jpg", alt: "Heuer Autavia, case profile", isPrimary: false },
    ],
  },
  {
    id: "7",
    slug: "heuer-carrera-2447",
    brand: "Heuer",
    model: "Carrera",
    referenceNumber: "2447",
    year: 1964,
    movement: "Valjoux 72, manual wind chronograph",
    caseSize: "36mm",
    caseMaterial: "Stainless steel",
    dialColor: "Silver with black registers",
    category: "Chronograph",
    featured: false,
    description:
      "Jack Heuer stripped the Carrera back to three registers on a clean silver ground, and it has not needed anything since.",
    story:
      "Heuer designed the Carrera for people reading a dial at speed, so the printing went where it would not get in the way: the tachymetre onto the inner flange, nothing else on the dial but the registers.\n\nThe dial on this one has picked up a faint spotting across the silver, which is what happens to these after sixty years and is not worth correcting.",
    images: [
      { src: "/images/collection/7.jpg", alt: "Heuer Carrera chronograph, silver dial with black registers, tan leather strap", isPrimary: true },
    ],
  },
  {
    id: "8",
    slug: "jaeger-lecoultre-memovox-e855",
    brand: "Jaeger-LeCoultre",
    model: "Memovox",
    referenceNumber: "E855",
    year: 1958,
    movement: "Calibre K825, automatic with alarm",
    caseSize: "37mm",
    caseMaterial: "Stainless steel",
    dialColor: "Silver",
    category: "Complication",
    featured: false,
    description:
      "Two crowns: one winds the watch, the other sets an alarm that rings against the case back.",
    story:
      "The Memovox is a wristwatch with a bell in it. The inner disc sets the alarm, the upper crown winds it, and a hammer strikes a pin on the inside of the case back. It is loud enough to wake you and quiet enough to be polite about it.\n\nJaeger-LeCoultre kept making versions of this for forty years. The early automatic ones like this are the ones to have.",
    images: [
      { src: "/images/collection/8.jpg", alt: "Jaeger-LeCoultre Memovox alarm watch, silver dial, two crowns, black strap", isPrimary: true },
    ],
  },
  {
    id: "9",
    slug: "longines-cushion-1526",
    brand: "Longines",
    model: "Cushion",
    referenceNumber: "15.26",
    year: 1934,
    movement: "Calibre 9.32, manual wind",
    caseSize: "32mm",
    caseMaterial: "Stainless steel",
    dialColor: "Silvered",
    category: "Dress",
    featured: false,
    description:
      "The oldest watch in the collection. Painted Arabic numerals, blued hands, a sub-seconds register, and a case with no straight lines in it.",
    story:
      "This is what a wristwatch looked like before the war settled the argument about what a wristwatch should look like. The case is a cushion, soft on every edge. The numerals are painted, not applied. The seconds sit in their own small register.\n\nThe dial has aged to a warm off-white with fine crazing across it. Nine decades of that is not damage, it is provenance.",
    images: [
      { src: "/images/collection/9.jpg", alt: "Longines cushion case, silvered dial with Arabic numerals and blued hands, oxblood strap", isPrimary: true },
    ],
  },
  {
    id: "10",
    slug: "tudor-oyster-prince-submariner-7016",
    brand: "Tudor",
    model: "Oyster Prince Submariner",
    referenceNumber: "7016/0",
    year: 1969,
    movement: "ETA 2483, automatic",
    caseSize: "39mm",
    caseMaterial: "Stainless steel",
    dialColor: "Black",
    category: "Diver",
    featured: false,
    description:
      "Rated to 200 metres, with a matte black dial, plot markers gone the colour of butter, and the original bezel insert.",
    story:
      "Before the snowflake handset arrived, Tudor's Submariner looked like this: pencil hands, round plots, the shield on the dial and nothing else to argue about.\n\nThe insert has faded a little unevenly and there is a scratch through the 40. Both stay. The point of keeping a tool watch is that it shows it was used.",
    images: [
      { src: "/images/collection/10.jpg", alt: "Tudor Oyster Prince Submariner, black dial and bezel, steel bracelet", isPrimary: true },
    ],
  },
  {
    id: "11",
    slug: "girard-perregaux-tonneau-9433",
    brand: "Girard-Perregaux",
    model: "Tonneau",
    referenceNumber: "9433",
    year: 1972,
    movement: "Calibre 32A, manual wind",
    caseSize: "34mm × 38mm",
    caseMaterial: "Stainless steel",
    dialColor: "Anthracite",
    category: "Dress",
    featured: false,
    description:
      "A tonneau case in brushed steel and an anthracite dial that goes from charcoal to near black depending on how you hold it.",
    story:
      "The early seventies produced a great deal of angular steel, most of it forgettable. This one works because the case is finished properly: brushed across the top, polished on the flanks, with a crisp line between them.\n\nThe dial is the other reason. Anthracite sunburst is difficult to photograph and better in the hand, where it moves between charcoal and black as the light shifts.",
    images: [
      { src: "/images/collection/11.jpg", alt: "Girard-Perregaux tonneau case, anthracite sunburst dial, black leather strap", isPrimary: true },
    ],
  },
  {
    id: "12",
    slug: "universal-geneve-polerouter-20217",
    brand: "Universal Genève",
    model: "Polerouter",
    referenceNumber: "20217-1",
    year: 1958,
    movement: "Calibre 215, micro-rotor automatic",
    caseSize: "35mm",
    caseMaterial: "Stainless steel",
    dialColor: "Silvered with textured chapter ring",
    category: "Dress",
    featured: false,
    description:
      "Designed by Gerald Genta when he was 23, for the airline that started flying over the North Pole.",
    story:
      "SAS began flying polar routes in 1954 and needed a watch whose movement would survive the magnetic fields up there. Universal Genève built one and put a 23-year-old Gerald Genta on the design.\n\nThe micro-rotor movement is the interesting part: it let the case stay thin without giving up automatic winding, decades before anyone else made that work well. The beads-of-rice bracelet is original.",
    images: [
      { src: "/images/collection/12.jpg", alt: "Universal Genève Polerouter, silvered dial with textured chapter ring, beads-of-rice bracelet", isPrimary: true },
    ],
  },
];

export const articles: Article[] = [
  {
    id: "1",
    slug: "the-art-of-keeping-time",
    title: "The Art of Keeping Time",
    subtitle: "On patience, and the work of keeping old watches running",
    excerpt:
      "Most of the work is waiting. A movement comes apart in an afternoon and goes back together over weeks, because the part you need was last made in 1961.",
    content: journalContent["the-art-of-keeping-time"],
    coverImage: "/images/journal/the-art-of-keeping-time.jpg",
    coverImageAlt:
      "A wristwatch with its case back removed, movement exposed, on a workbench beside a loupe, tweezers and screwdrivers",
    category: "essay",
    featured: true,
    publishedAt: "2026-01-18",
  },
  {
    id: "2",
    slug: "the-passion-behind-a-collection",
    title: "The Passion Behind a Collection",
    subtitle: "How one watch turned into several hundred",
    excerpt:
      "It started with a watch that did not work. Getting it running meant finding someone who could, and that turned out to be the interesting part.",
    content: journalContent["the-passion-behind-a-collection"],
    coverImage: "/images/journal/the-passion-behind-a-collection.jpg",
    coverImageAlt:
      "Six vintage wristwatches laid out in a lined leather watch box",
    category: "story",
    featured: false,
    publishedAt: "2026-02-04",
  },
  {
    id: "3",
    slug: "when-a-watch-needs-a-second-life",
    title: "When a Watch Needs a Second Life",
    subtitle: "Restoration, and where it stops",
    excerpt:
      "There is a line between making a watch work again and making it look new. The second one usually erases the first sixty years.",
    content: journalContent["when-a-watch-needs-a-second-life"],
    coverImage: "/images/journal/when-a-watch-needs-a-second-life.jpg",
    coverImageAlt:
      "An exposed watch movement with its case back set down beside it, next to screwdrivers, tweezers and a dust blower",
    category: "story",
    featured: false,
    publishedAt: "2026-02-21",
  },
  {
    id: "4",
    slug: "why-we-keep-old-watches",
    title: "Why We Keep Old Watches",
    subtitle: "On objects that outlive their purpose",
    excerpt:
      "Nobody needs a mechanical watch to know the time. That stopped being the point around 1975, and the watches got more interesting afterwards.",
    content: journalContent["why-we-keep-old-watches"],
    coverImage: "/images/journal/why-we-keep-old-watches.jpg",
    coverImageAlt:
      "A single aged wristwatch with a warmed dial resting on dark weathered wood",
    category: "essay",
    featured: false,
    publishedAt: "2026-03-09",
  },
];

export const archiveItems: ArchiveItem[] = [
  {
    id: "1",
    title: "Vintage Catalogues",
    description:
      "Dealer catalogues and printed price lists from the 1940s onward, which are often the only surviving record of what a reference originally shipped with.",
    image: "/images/archive/vintage-catalogues.jpg",
    imageAlt: "An open vintage watch catalogue showing printed reference listings",
  },
  {
    id: "2",
    title: "Watchmaker's Tools",
    description:
      "Benches, loupes, staking sets and the small instruments the work depends on. Most of them are older than the watches they are used on.",
    image: "/images/archive/watchmakers-tools.jpg",
    imageAlt: "Watchmaker's hand tools arranged across a worn wooden bench",
  },
  {
    id: "3",
    title: "Old Advertisements",
    description:
      "How watches were sold, and what that says about who was expected to buy them. The copy dates faster than the designs do.",
    image: "/images/archive/old-advertisements.jpg",
    imageAlt: "A historical printed advertisement for a wristwatch",
  },
  {
    id: "4",
    title: "Archival Materials",
    description:
      "Papers, boxes, guarantees and service receipts kept alongside the watches. Provenance is mostly paperwork.",
    image: "/images/archive/archival-materials.jpg",
    imageAlt: "Archival documents, guarantee papers and watch boxes",
  },
];

export const homeStats: Statistic[] = [
  { value: "1000+", label: "Selected Timepieces" },
  { value: "50+", label: "Brands" },
  { value: "1900–2000", label: "Years Represented" },
];

/**
 * Static page copy. Every string here becomes an editable field in the CMS,
 * so components should read from this object rather than hard-coding text.
 */
export const pageContent = {
  home: {
    hero: {
      headline: "Indonesia Wristwatch Museum",
      tagline: "A Private Collection of Exceptional Timepieces",
    },
    about: {
      label: "About the Museum",
      headline: "A collection preserved through time.",
      body: [
        "Indonesia Wristwatch Museum is a private museum built around a single collection of mechanical watches. What is shown here is a selection. The collection behind it is considerably larger, and it is still growing.",
        "A watch earns its place for what it can tell you: how it was made, what a workshop could manage in a given decade, what people expected a watch to look like at the time. A few are rare. Most are not. Every one of them was kept because somebody thought it was worth keeping.",
      ],
      image: "/images/about-museum.jpg",
      imageAlt: "Macro detail of a vintage wristwatch dial",
      // Not "More Information": that phrase is on the list of generic link
      // text Lighthouse flags, and it tells a reader nothing about where the
      // link goes. The label names the destination instead, and differs from
      // the section eyebrow above it so the two do not read as a stutter.
      ctaLabel: "About the collection",
      ctaHref: "/about",
    },
    collection: {
      label: "The Collection",
      headline: "A lifetime of fascination with mechanical timepieces.",
      body: "The watches here were chosen one at a time, over decades, for reasons that were rarely the same twice. Some for how they were built. Some for who made them, or when. A few for no better reason than that they were hard to put down.",
    },
    featured: {
      label: "Selected Timepieces",
      headline: "A glimpse into the collection.",
    },
    cta: {
      headline: "Discover the collection.",
      body: "Every watch currently on display, with what is known about each one.",
      buttonText: "Explore Collection",
      buttonHref: "/collection",
    },
  },
  collection: {
    headline: "The Collection",
    description:
      "A curated selection of exceptional wristwatches preserved within the museum.",
  },
  journal: {
    headline: "Journal",
    subhead: "Stories Beyond the Collection",
    description:
      "Stories, observations, and discoveries from the world surrounding the museum and its collection.",
    heroImage: "/images/archive/watchmakers-tools.jpg",
    heroImageAlt: "Watchmaker's hand tools arranged across a worn wooden bench",
    archive: {
      label: "From the Archive",
      description:
        "A glimpse into the documents, photographs, catalogues, and objects that accompany the collection.",
    },
    cta: {
      headline: "There is always more to discover.",
      body: "Explore the stories, objects, and history preserved within the collection.",
      buttonText: "Explore the Collection",
      buttonHref: "/collection",
    },
  },
} as const;

export const featuredTimepieces = timepieces.filter((t) => t.featured);

/* -------------------------------------------------------------------------- */
/*  Collection filters                                                        */
/* -------------------------------------------------------------------------- */

/** "1956" -> "1950s". The collection spans four decades, so a decade is the
 *  useful granularity for the Era filter. */
export function eraOf(timepiece: Timepiece): string {
  if (!timepiece.year) return "Unknown";
  return `${Math.floor(timepiece.year / 10) * 10}s`;
}

function distinct(values: string[]): string[] {
  return [...new Set(values)];
}

export const brands = distinct(timepieces.map((t) => t.brand)).sort((a, b) =>
  a.localeCompare(b)
);

export const eras = distinct(timepieces.map(eraOf)).sort();

export const types = distinct(
  timepieces.map((t) => t.category).filter((c): c is string => Boolean(c))
).sort((a, b) => a.localeCompare(b));

/** Everything the search box matches against, lowercased once per item. */
function haystack(timepiece: Timepiece): string {
  return [
    timepiece.brand,
    timepiece.model,
    timepiece.referenceNumber,
    timepiece.year,
    timepiece.category,
    eraOf(timepiece),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export interface CollectionFilters {
  query?: string;
  brand?: string;
  era?: string;
  type?: string;
}

/**
 * Client-side filtering for the collection page. Every clause is additive, so
 * an empty filter object returns the whole collection.
 */
export function filterTimepieces(
  items: readonly Timepiece[],
  { query, brand, era, type }: CollectionFilters
): Timepiece[] {
  const q = query?.trim().toLowerCase();
  return items.filter((t) => {
    if (brand && t.brand !== brand) return false;
    if (era && eraOf(t) !== era) return false;
    if (type && t.category !== type) return false;
    if (q && !haystack(t).includes(q)) return false;
    return true;
  });
}

export function getTimepieceBySlug(slug: string): Timepiece | undefined {
  return timepieces.find((t) => t.slug === slug);
}

/** The entries either side of a timepiece, wrapping at both ends. */
export function getTimepieceNeighbours(slug: string): {
  previous: Timepiece | null;
  next: Timepiece | null;
} {
  const index = timepieces.findIndex((t) => t.slug === slug);
  if (index === -1) return { previous: null, next: null };
  const count = timepieces.length;
  return {
    previous: timepieces[(index - 1 + count) % count] ?? null,
    next: timepieces[(index + 1) % count] ?? null,
  };
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export const featuredArticle =
  articles.find((a) => a.featured) ?? articles[0];

/** Everything except the featured piece, newest first. */
export const storyArticles = articles
  .filter((a) => a.slug !== featuredArticle?.slug)
  .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

/** Up to `limit` other articles, in reading order, wrapping past the end. */
export function getRelatedArticles(slug: string, limit = 3): Article[] {
  const index = articles.findIndex((a) => a.slug === slug);
  if (index === -1) return articles.slice(0, limit);
  const rotated = [
    ...articles.slice(index + 1),
    ...articles.slice(0, index),
  ];
  return rotated.slice(0, limit);
}

/** "2026-01-18" -> "18 January 2026". Locale-fixed so SSR and client agree. */
export function formatArticleDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const CATEGORY_LABELS: Record<Article["category"], string> = {
  story: "Story",
  archive: "Archive",
  essay: "Essay",
};
