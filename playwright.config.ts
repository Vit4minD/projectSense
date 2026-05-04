import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.E2E_PORT ?? "3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_USE_EMULATOR: "true",
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-project",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo.appspot.com",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "1",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:1:web:1",
      NEXT_PUBLIC_FIREBASE_DATABASE_URL: "http://127.0.0.1:9000/?ns=demo-project",
    },
  },
});
