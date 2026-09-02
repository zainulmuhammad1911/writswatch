import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { getSiteSettings } from "@/lib/content";
import { getTimepieces } from "@/lib/queries";

/**
 * Skip link, header, main landmark, footer.
 *
 * Extracted from the public layout because the root `not-found.tsx` needs the
 * same chrome and sits outside the `(public)` route group. An unmatched URL is
 * the one page a visitor most needs navigation on, so it cannot be the one
 * page without a header.
 */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const [timepieces, settings] = await Promise.all([
    getTimepieces(),
    getSiteSettings(),
  ]);
  const searchItems = timepieces.map((timepiece) => ({
    label: `${timepiece.brand} ${timepiece.model}`,
    href: `/collection/${timepiece.slug}`,
  }));

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-navy focus:px-4 focus:py-3 focus:text-small focus:text-pure-white"
      >
        Skip to content
      </a>
      <Header searchItems={searchItems} transparentOnTop />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer
        siteName={settings.title}
        social={{
          instagram: settings.instagram,
          youtube: settings.youtube,
          x: settings.x,
          email: settings.email,
        }}
        // Resolved on the server, so the footer of a cached page and the
        // markup React hydrates it with cannot disagree across new year.
        year={new Date().getUTCFullYear()}
      />
    </>
  );
}
