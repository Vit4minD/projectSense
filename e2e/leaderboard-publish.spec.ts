import { expect, test } from "@playwright/test";

/**
 * After a 5/5 personal-best drill, the client should fire-and-forget POST to
 * /api/leaderboard, the Admin SDK should verify the ID token + drill record,
 * and the Leaderboard page should then show a row for the new user.
 *
 * Prereq: Firebase emulator suite must be running:
 *   pnpm emulators
 * (CI uses `pnpm e2e:emulators` which wraps Playwright in `firebase emulators:exec`.)
 */
test("complete a 5/5 drill → leaderboard entry appears", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Create account" }).first().click();

  const email = `leader-${Date.now()}@example.com`;
  const displayName = `Tester ${Math.floor(Math.random() * 9999)}`;
  await page.getByPlaceholder("Sam Park").fill(displayName);
  await page.getByPlaceholder("you@school.edu").fill(email);
  await page.getByPlaceholder(/min 6/).fill("hunter2");
  await page.getByPlaceholder("St. Mark's").fill("Test High");

  await page.getByRole("button", { name: /Create account/i }).click();

  await expect(page.getByRole("heading", { name: /Eighty problems/ })).toBeVisible({
    timeout: 15_000,
  });

  // Trick 01 has the simplest deterministic prompts (n × 11).
  await page.getByText("Multiplying by 11").first().click();

  for (let i = 0; i < 5; i++) {
    const prompt = await page.locator(".drill-problem").innerText();
    const match = prompt.match(/(\d+)\s*[×x]\s*11/);
    expect(match, `prompt #${i + 1} did not match: ${prompt}`).not.toBeNull();
    const n = Number(match![1]);
    const ans = String(n * 11);
    await page.locator("input.drill-input").fill(ans);
    await page.locator("input.drill-input").press("Enter");
    await page.waitForTimeout(150);
  }

  await expect(page.getByText(/total time/i)).toBeVisible({ timeout: 10_000 });

  // Give the fire-and-forget POST /api/leaderboard a moment to commit.
  await page.waitForTimeout(1500);

  await page.goto("/leaderboard");
  await expect(page.getByRole("heading", { name: /Top times/i })).toBeVisible();

  // Trick 01 ("Multiplying by 11") is selected by default — that's the trick we drilled.
  // The user should appear on the board, with the "you" badge.
  await expect(page.getByText(displayName).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("text=you").first()).toBeVisible();
});
