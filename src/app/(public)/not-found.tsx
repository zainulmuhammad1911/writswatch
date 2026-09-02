import { RequestedPath } from "@/components/public/RequestedPath";
import {
  ERROR_ROUTES,
  ErrorRoutes,
  ErrorScreen,
} from "@/components/public/ErrorScreen";

/**
 * 404, for a public page that called `notFound()` — a timepiece slug that does
 * not exist, or an article that was unpublished after somebody linked it.
 */
export const metadata = {
  title: "Page not found",
  // A 404 in the index is worse than no 404 in the index.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
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
  );
}
