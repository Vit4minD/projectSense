import { expect, test } from "@playwright/test";

/**
 * README screenshot capture (not a correctness test). Registers a fresh user on
 * the emulator, runs one 5/5 drill so home/leaderboard aren't empty, and saves
 * curated viewport screenshots to docs/screenshots/ for the README.
 *
 * Run against the emulator, e.g.:
 *   firebase emulators:exec --only auth,firestore,database \
 *     "playwright test e2e/screenshots.spec.ts --project=chromium"
 */

const SHOTS = "docs/screenshots";

test.use({ viewport: { width: 1440, height: 900 } });

test("capture README screenshots", async ({ page }) => {
  test.setTimeout(120_000);

  // Remove the Next.js dev-tools overlay (the "N Issues" badge) so it doesn't
  // appear in screenshots. It renders inside a top-level <nextjs-portal>.
  const shot = async (name: string) => {
    await page.evaluate(() => document.querySelector("nextjs-portal")?.remove()).catch(() => {});
    await page.screenshot({ path: `${SHOTS}/${name}.png` });
  };

  // ---- Login (logged out) ----
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(700);
  await shot("login");

  // ---- Register ----
  await page.getByRole("button", { name: "Create account" }).first().click();
  const email = `shots-${Date.now()}@example.com`;
  await page.getByPlaceholder("Sam Park").fill("Sam Park");
  await page.getByPlaceholder("you@school.edu").fill(email);
  await page.getByPlaceholder(/min 6/).fill("hunter2");
  await page.getByPlaceholder("St. Mark's").fill("St. Mark's");
  await page.locator("button.login-submit-btn").click();

  // ---- Home + first-sign-in announcement popup ----
  await expect(page.getByRole("heading", { name: /Pinned for you/ })).toBeVisible({
    timeout: 15_000,
  });
  const announce = page.getByRole("dialog", { name: /What's new/i });
  if (await announce.isVisible().catch(() => false)) {
    await page.waitForTimeout(300);
    await shot("announcement");
    await page.getByRole("button", { name: /Got it/i }).click();
    await announce.waitFor({ state: "hidden" }).catch(() => {});
  }
  await page.waitForTimeout(500);
  await shot("home");

  // ---- Drill (clean problem view) ----
  await page.goto("/drill/1"); // direct nav is deterministic (card click races the modal dismiss)
  await expect(page.locator(".drill-problem")).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(600);
  await shot("drill");

  // Arm the leaderboard-publish waiter BEFORE the final answer — the POST is
  // fire-and-forget, so listening after the fact is racy (mirrors leaderboard-publish.spec).
  const publishResp = page
    .waitForResponse(
      (r) => r.url().includes("/api/leaderboard") && r.request().method() === "POST",
      { timeout: 20_000 },
    )
    .catch(() => null);

  // Complete the 5/5 run so the leaderboard has a row.
  const input = page.locator("input.drill-input");
  for (let i = 0; i < 5; i++) {
    await expect(page.locator(".drill-problem")).toBeVisible();
    const prompt = await page.locator(".drill-problem").innerText();
    const match = prompt.match(/(\d+)\s*[×x]\s*11/);
    expect(match, `prompt #${i + 1}: ${prompt}`).not.toBeNull();
    await input.fill(String(Number(match![1]) * 11));
    if (i < 4) await expect(input).toHaveValue("", { timeout: 5_000 });
  }
  await expect(page.getByText(/total time/i)).toBeVisible({ timeout: 10_000 });
  await publishResp; // wait for the publish POST to complete before reading the board

  // ---- Leaderboard (row now published) ----
  await page.goto("/leaderboard");
  await page.waitForLoadState("networkidle");
  await page
    .locator(".leaderboard-row")
    .first()
    .waitFor({ state: "visible", timeout: 10_000 })
    .catch(() => {});
  await page.waitForTimeout(400);
  await shot("leaderboard");

  // ---- Twenty-Four ----
  await page.goto("/games/twenty-four");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /^Start$/ }).first().click().catch(() => {});
  await page.waitForTimeout(700);
  await shot("twenty-four");

  // ---- AI test (landing / generate view) ----
  await page.goto("/test");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(700);
  await shot("ai-test");
});
