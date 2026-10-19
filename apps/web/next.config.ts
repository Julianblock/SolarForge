import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@solarforge/engine", "@solarforge/shared"],
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
