import { expect, test, type Page } from "@playwright/test";

/**
 * Per-route smoke test: visit every user-facing route against a production build
 * + the Firebase emulator, assert the page throws no uncaught JS errors, and
 * capture a full-page screenshot for the visual-review pass. Screenshots land in
 * `test-results/shots/`.
 *
 * We fail on `pageerror` (uncaught exceptions = a genuinely broken page) rather
 * than on console.error, which in a real app carries benign noise (emulator
 * network chatter, dev warnings) that would make the smoke test flaky. Console
 * errors are still recorded and logged for the reviewer.
 */

const PUBLIC_ROUTES = ["/login", "/trick/1", "/stats"];
const AUTHED_ROUTES = [
  "/",
  "/leaderboard",
  "/multiplayer",
  "/test",
  "/games",
  "/games/twenty-four",
  "/games/zetamac",
  "/profile",
  "/drill/1",
];

function shotName(prefix: string, route: string): string {
  const slug = route === "/" ? "_root" : route.replace(/\//g, "_");
  return `test-results/shots/${prefix}${slug}.png`;
}

function collectErrors(page: Page): { pageErrors: string[]; consoleErrors: string[] } {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  return { pageErrors, consoleErrors };
}

async function register(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: "Create account" }).first().click();
  const email = `smoke-${Date.now()}@example.com`;
  await page.getByPlaceholder("Sam Park").fill("Smoke Test");
  await page.getByPlaceholder("you@school.edu").fill(email);
  await page.getByPlaceholder(/min 6/).fill("hunter2");
  await page.getByPlaceholder("St. Mark's").fill("Test School");
  await page.locator("button.login-submit-btn").click();
  await expect(page.getByRole("heading", { name: /Eighty problems/ })).toBeVisible({
    timeout: 15_000,
  });
}

test("public routes render logged out with no page errors", async ({ page }) => {
  const { pageErrors, consoleErrors } = collectErrors(page);
  for (const route of PUBLIC_ROUTES) {
    pageErrors.length = 0;
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: shotName("public", route), fullPage: true });
    if (consoleErrors.length) console.log(`[console] ${route}:`, consoleErrors.slice(-5));
    expect(pageErrors, `uncaught error(s) on ${route}: ${pageErrors.join(" | ")}`).toEqual([]);
  }
});

test("authed routes render without page errors", async ({ page }) => {
  const { pageErrors, consoleErrors } = collectErrors(page);
  await register(page);
  for (const route of AUTHED_ROUTES) {
    pageErrors.length = 0;
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    // A redirect back to /login means the auth gate rejected us — a real bug.
    expect(page.url(), `unexpectedly redirected to /login from ${route}`).not.toContain("/login");
    await page.screenshot({ path: shotName("authed", route), fullPage: true });
    if (consoleErrors.length) console.log(`[console] ${route}:`, consoleErrors.slice(-5));
    expect(pageErrors, `uncaught error(s) on ${route}: ${pageErrors.join(" | ")}`).toEqual([]);
  }
});
