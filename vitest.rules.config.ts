import { defineConfig } from "vitest/config";
import path from "node:path";

// Security-rules tests run against the Firebase emulator (see `test:rules`) in a
// plain Node environment — no jsdom, no React. Kept separate from the default
// vitest.config.ts so the emulator-only suite is opt-in.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["rules-tests/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
