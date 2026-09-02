import type { Metadata, Viewport } from "next";
import { getSiteSettings } from "@/lib/content";
import { fontVariables } from "@/lib/fonts";
import { SITE_URL } from "@/lib/seo";
import "@/styles/globals.css";

/**
 * Site-wide metadata, read from the editable settings.
 *
 * A title and description an editor can change belong in the database, not in
 * a constant, and the SEO defaults tab in the dashboard has been writing
 * `seo.title` / `seo.description` / `seo.ogImage` since Fase 9 with nothing
 * reading them. This is what reads them. Each falls back to the corresponding
 * site setting, so an editor who fills in only the site name still gets
 * sensible tags everywhere.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings.seoTitle || settings.title;
  const description = settings.seoDescription || settings.description;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      // Page titles read "The Collection — Indonesia Wristwatch Museum".
      template: `%s — ${settings.title}`,
    },
    description,
    applicationName: settings.title,
    openGraph: {
      type: "website",
      siteName: settings.title,
      title,
      description,
      locale: "en_US",
      url: "/",
      // Stated explicitly rather than left to the `opengraph-image` file
      // convention, which did not survive this segment also exporting an
      // `openGraph` block: the tag went missing entirely. An editor's own
      // share image in Settings wins; otherwise the generated card.
      images: [
        {
          url: settings.ogImage || "/opengraph-image",
          width: 1200,
          height: 630,
          alt: settings.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [settings.ogImage || "/opengraph-image"],
    },
    alternates: { canonical: "/" },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    // Deliberately no `icons` block. `favicon.ico` and `apple-icon.png` in
    // this directory are file conventions, and Next emits both links itself
    // with a content hash on the URL:
    //
    //   /favicon.ico?favicon.15ark7ra6zv_2.ico   sizes="64x64"
    //   /apple-icon.png?apple-icon.3odbt...png   sizes="180x180"
    //
    // Stating `icons` here replaced that with the bare paths — the same
    // field-level override that dropped og:image above. Bare paths still
    // resolve, but they carry no hash, so a browser that cached the previous
    // favicon keeps serving it. Leave this out.
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximumScale / userScalable — pinch zoom stays available.
  themeColor: "#F5F7F8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full`}>
      <head>
        <noscript>
          {/* Scroll reveals ship from the server at opacity 0. Without JS the
              page must still show all of its content. */}
          <style>{`[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col bg-cool-white text-graphite">
        {children}
      </body>
    </html>
  );
}
