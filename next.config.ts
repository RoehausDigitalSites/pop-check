import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Smaller Cloudflare Worker bundles: avoid pulling full barrel exports.
  experimental: {
    optimizePackageImports: ["recharts", "date-fns", "date-fns-tz"],
  },
};

export default nextConfig;
