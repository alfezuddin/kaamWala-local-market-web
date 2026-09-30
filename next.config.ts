import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve("."),
  },
  images: {
    // All imagery in this project is generated locally (CSS + inline SVG),
    // so the remote image allow-list stays empty on purpose.
    remotePatterns: [],
  },
};

export default nextConfig;
