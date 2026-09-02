import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { getTimepieces } from "@/lib/queries";

/**
 * Public website shell: skip link, header, main landmark, footer.
 *
 * The header needs to know whether the page opens with a full-bleed hero. It
 * decides that by looking for the hero element itself (see HERO_SENTINEL_ID),
 * so no page has to pass a flag down through the layout.
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const timepieces = await getTimepieces();
  const searchItems = timepieces.map((t) => ({
    label: `${t.brand} ${t.model}`,
    href: `/collection/${t.slug}`,
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
      <Footer />
    </>
  );
}
