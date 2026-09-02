import { SiteChrome } from "@/components/public/SiteChrome";
import { RequestedPath } from "@/components/public/RequestedPath";
import {
  ERROR_ROUTES,
  ErrorRoutes,
  ErrorScreen,
} from "@/components/public/ErrorScreen";

/**
 * 404, for a URL that matches no route at all.
 *
 * This one sits outside the `(public)` group, so it brings its own header and
 * footer through `SiteChrome`. Same design as the in-group version: a visitor
 * cannot tell the difference, which is the point.
 */
export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <SiteChrome>
      <ErrorScreen
        label="404"
        headline="Not in the register."
        reference={<RequestedPath />}
        actions={<ErrorRoutes routes={ERROR_ROUTES} />}
      >
        <p>
          There is nothing at this address. Either the link was mistyped, or it
          pointed at something that has since been renamed or taken down.
        </p>
        <p>
          The collection index is the reliable way in. Everything on the site is
          reachable from one of the three below.
        </p>
      </ErrorScreen>
    </SiteChrome>
  );
}
