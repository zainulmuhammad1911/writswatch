import { Geist, Newsreader } from "next/font/google";

/**
 * Newsreader — display serif.
 * Hero, section headlines, feature titles, statistic figures.
 * Editorial, elegant, historical.
 */
export const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  // Variable font: the full 200-800 weight range plus the optical-size axis,
  // which keeps the 5rem hero from looking spindly next to 1rem body copy.
  style: ["normal"],
  axes: ["opsz"],
});

/**
 * Newsreader italic — pulled quotes in journal articles, and nothing else.
 *
 * Its own instance, and deliberately not preloaded. Asking the first one for
 * `style: ["normal", "italic"]` made next/font preload both faces in the
 * document head of every route, which put 144.5 KB of italic outlines on the
 * wire for the homepage, the collection and every timepiece page, none of
 * which render a single italic character. Only the four journal articles do.
 *
 * With `preload: false` the face is declared but not fetched until a glyph
 * actually needs it, so the pages that have a quote pay for it and the rest
 * do not. The swap arrives late on those four, which is survivable for one
 * blockquote most of the way down an article.
 */
export const newsreaderItalic = Newsreader({
  variable: "--font-newsreader-italic",
  subsets: ["latin"],
  display: "swap",
  style: ["italic"],
  axes: ["opsz"],
  preload: false,
});

/**
 * Geist — UI sans.
 * Body copy, navigation, metadata, filters, buttons, specifications, captions.
 * Modern, clean, precise.
 */
export const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
  // Variable font: full 100-900 weight range.
});

export const fontVariables = `${newsreader.variable} ${newsreaderItalic.variable} ${geist.variable}`;
