import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://indonesiawristwatchmuseum.com"),
  title: {
    default: "Indonesia Wristwatch Museum",
    template: "%s — Indonesia Wristwatch Museum",
  },
  description:
    "A private museum dedicated to the preservation and appreciation of exceptional timepieces.",
  openGraph: {
    type: "website",
    siteName: "Indonesia Wristwatch Museum",
    locale: "en_US",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

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
