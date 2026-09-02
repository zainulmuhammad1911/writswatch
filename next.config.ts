import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next regenerates a generic AGENTS.md/CLAUDE.md on every dev boot. README.md
  // is this project's source of truth, so keep them out of the tree.
  agentRules: false,
  images: {
    // Timepiece photography is the content — keep AVIF/WebP and a device ladder
    // that matches the breakpoints in globals.css.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [375, 640, 768, 1024, 1280, 1440, 1920, 2560],
    imageSizes: [64, 96, 128, 256, 384],
  },
};

export default nextConfig;
