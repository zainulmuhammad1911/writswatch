import { revalidatePath } from "next/cache";

/**
 * Clears the cached public pages a dashboard write has just invalidated.
 *
 * The public routes are regenerated on an hourly timer (see the `revalidate`
 * export in the public layout). That is the backstop, not the mechanism: an
 * editor who publishes a timepiece expects to see it, and being told to wait
 * up to an hour would make the dashboard feel broken. So every write calls
 * this with the paths it affects.
 *
 * Failures are swallowed for the same reason `audit()` swallows its own: the
 * write has already succeeded and been recorded, and turning a stale cache
 * into a 500 would be a worse outcome than a page that catches up on the
 * timer.
 */
export function revalidate(...paths: string[]): void {
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (error) {
      console.error(`[revalidate] ${path} failed`, error);
    }
  }
}

/** Everything a change to one timepiece can appear on. */
export function revalidateTimepiece(slug?: string): void {
  revalidate(
    "/",
    "/collection",
    "/sitemap.xml",
    ...(slug ? [`/collection/${slug}`] : [])
  );
}

/** Everything a change to one article can appear on. */
export function revalidateArticle(slug?: string): void {
  revalidate(
    "/journal",
    "/sitemap.xml",
    ...(slug ? [`/journal/${slug}`] : [])
  );
}

/**
 * A settings change touches the header, the footer, and the metadata on every
 * page, so the whole tree goes.
 */
export function revalidateEverything(): void {
  try {
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("[revalidate] layout failed", error);
  }
}
