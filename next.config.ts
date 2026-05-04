import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin Turbopack root to this project so a stray lockfile elsewhere on the
  // machine doesn't trigger Next's workspace-root inference warning.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
