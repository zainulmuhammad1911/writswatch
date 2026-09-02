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
  style: ["normal", "italic"],
  axes: ["opsz"],
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

export const fontVariables = `${newsreader.variable} ${geist.variable}`;
