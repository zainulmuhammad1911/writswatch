import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/content";

/**
 * The default share image, generated rather than exported from a design tool
 * so it stays in step with the site name in Settings.
 *
 * Pages with a photograph of their own (a timepiece, an article) override this
 * in their own metadata. This is what a link to the homepage, the collection
 * listing, or the about page unfurls as.
 */

export const alt = "Indonesia Wristwatch Museum";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Satori has no access to the fonts `next/font` self-hosts, so the display
 * face is fetched once per build.
 *
 * Requesting the CSS without a User-Agent header makes Google serve TrueType
 * rather than woff2, which is the format Satori can actually parse. If the
 * fetch fails the image still renders in Satori's built-in sans: a share card
 * in the wrong typeface is a smaller problem than a build that fails because
 * a font CDN was briefly unreachable.
 */
async function displayFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Newsreader:wght@500",
      { cache: "force-cache" }
    ).then((response) => response.text());
    const url = /src:\s*url\((https:[^)]+)\)/.exec(css)?.[1];
    if (!url) return null;
    return await fetch(url, { cache: "force-cache" }).then((response) =>
      response.arrayBuffer()
    );
  } catch {
    return null;
  }
}

export default async function Image() {
  const [settings, font] = await Promise.all([
    getSiteSettings(),
    displayFont(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // The palette from globals.css. Satori resolves no CSS variables, so
          // the two colours are written out.
          backgroundColor: "#F5F7F8",
          color: "#171A1D",
          fontFamily: font ? "Newsreader" : "sans-serif",
          padding: 96,
        }}
      >
        {/* A hairline frame, the same border-grey the site uses for its
            dividers, so the card reads as a plate rather than a screenshot.
            Sides written out individually: Satori does not understand the
            `inset` shorthand, and the first version of this drew nothing. */}
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 40,
            bottom: 40,
            left: 40,
            border: "1px solid #D9DEE2",
          }}
        />
        <div
          style={{
            fontSize: 88,
            lineHeight: 1.05,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {settings.title.split(" ").map((word) => (
            <span key={word}>{word}</span>
          ))}
        </div>
        <div
          style={{ width: 72, height: 1, backgroundColor: "#162B3D", margin: "44px 0" }}
        />
        <div
          style={{
            fontSize: 30,
            letterSpacing: "0.06em",
            color: "#687078",
            textAlign: "center",
          }}
        >
          {settings.tagline}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Newsreader", data: font, style: "normal", weight: 500 }]
        : [],
    }
  );
}
