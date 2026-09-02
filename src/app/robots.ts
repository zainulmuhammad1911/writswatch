import type { MetadataRoute } from "next";
import { absolute } from "@/lib/seo";

/**
 * The dashboard and the API are disallowed.
 *
 * This is housekeeping, not security: it keeps admin URLs out of search
 * results and stops crawlers walking endpoints that will only return 401.
 * What actually protects those routes is the gate in `src/proxy.ts`.
 * A `Disallow` line is a request, and the crawlers that matter here are not
 * the ones worth defending against.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/", "/login"],
    },
    // No `Host:` line. It is a Yandex-only extension, deprecated even there,
    // and the canonical tags already say which host is authoritative.
    sitemap: absolute("/sitemap.xml"),
  };
}
