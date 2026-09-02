import { SiteChrome } from "@/components/public/SiteChrome";

/**
 * Public website shell.
 *
 * The header needs to know whether the page opens with a full-bleed hero. It
 * decides that by looking for the hero element itself (see HERO_SENTINEL_ID),
 * so no page has to pass a flag down through the layout.
 *
 * Every page in this group is regenerated at most once an hour. The dashboard
 * does not wait for that: the write routes in `/api` call `revalidatePath`, so
 * a published edit is live on the next request. The hour is the backstop for
 * anything that changes without going through the API.
 */
export const revalidate = 3600;

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome>{children}</SiteChrome>;
}
