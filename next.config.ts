import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin Turbopack root to this project so a stray lockfile elsewhere on the
  // machine doesn't trigger Next's workspace-root inference warning.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Allow the local loopback origins the dev server/e2e run under. Without this,
  // Next 16 blocks cross-origin dev resources (HMR/chunks) from 127.0.0.1, which
  // prevents client hydration during Playwright runs. Dev-only; no prod effect.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Keep firebase-admin (and its ESM-only `jose` transitive) out of the server
  // bundle — it's loaded via Node require at runtime, not bundled.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
