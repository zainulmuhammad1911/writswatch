import type { NextConfig } from "next";

/**
 * Security headers, from PRD section 9.
 *
 * Applied to every response rather than just the admin, because the public
 * pages are the ones an attacker can reach without credentials.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Retired by modern browsers in favour of CSP, and actively harmful in some
  // old ones. Kept because the PRD lists it; CSP is what actually protects.
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // data: for the inline SVG masks, blob: for the sharp-processed previews.
      "img-src 'self' data: blob:",
      // next/font self-hosts the files but Google Fonts stays allowed in case a
      // face is ever loaded at runtime.
      "font-src 'self' fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      // 'unsafe-inline' and 'unsafe-eval' are what Next's dev overlay and
      // hydration bootstrap need. Tightening this to a nonce is worth doing
      // before launch; it cannot be done without changing how Next injects
      // its bootstrap script.
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      // Belt to X-Frame-Options' braces, and the one browsers still honour.
      "frame-ancestors 'none'",
      "form-action 'self'",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework and its version.
  poweredByHeader: false,
  // Next regenerates a generic AGENTS.md/CLAUDE.md on every dev boot. README.md
  // is this project's source of truth, so keep them out of the tree.
  agentRules: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
