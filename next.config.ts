import type { NextConfig } from "next";
import { publicCsp, securityHeaders } from "./src/lib/csp";

/**
 * The public Content Security Policy.
 *
 * Scoped to everything except the routes the middleware covers, so a response
 * never carries two CSP headers. Browsers enforce every policy they are sent
 * independently, which means two policies quietly become their intersection —
 * a debugging problem nobody needs.
 *
 * `/admin`, `/login` and `/api` get the strict nonce policy from
 * `src/middleware.ts` instead. See `src/lib/csp.ts` for why there are two.
 */
const PUBLIC_ROUTES = "/((?!admin|login|api/).*)";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework and its version.
  poweredByHeader: false,
  // Next regenerates a generic AGENTS.md/CLAUDE.md on every dev boot. README.md
  // is this project's source of truth, so keep them out of the tree.
  agentRules: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: PUBLIC_ROUTES,
        headers: [{ key: "Content-Security-Policy", value: publicCsp() }],
      },
    ];
  },
  images: {
    // Timepiece photography is the content — keep AVIF/WebP and a device ladder
    // that matches the breakpoints in globals.css.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [375, 640, 768, 1024, 1280, 1440, 1920, 2560],
    imageSizes: [64, 96, 128, 256, 384],
  },
};

export default nextConfig;
