import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake heavy packages (smaller server bundles).
  experimental: {
    optimizePackageImports: ["recharts", "date-fns", "date-fns-tz"],
  },
};

export default nextConfig;
