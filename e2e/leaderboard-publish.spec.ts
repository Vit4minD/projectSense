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

  // Submit the register form. Target the submit button by class — the string
  // "Create account" also matches the mode-toggle tab above the form.
  await page.locator("button.login-submit-btn").click();

  await expect(page.getByRole("heading", { name: /Pinned for you/ })).toBeVisible({
    timeout: 15_000,
  });

  // Arm the response waiter BEFORE the drill finishes — the publish is a
  // fire-and-forget POST triggered on the final answer, so we must be listening
  // before it fires (waiting a fixed timeout after the fact is racy).
  const publishResp = page.waitForResponse(
    (r) => r.url().includes("/api/leaderboard") && r.request().method() === "POST",
    { timeout: 20_000 },
  );

  // Trick 01 has the simplest deterministic prompts (n × 11).
  await page.getByText("Multiplying by 11").first().click();

  const input = page.locator("input.drill-input");
  for (let i = 0; i < 5; i++) {
    await expect(page.locator(".drill-problem")).toBeVisible();
    const prompt = await page.locator(".drill-problem").innerText();
    const match = prompt.match(/(\d+)\s*[×x]\s*11/);
    expect(match, `prompt #${i + 1} did not match: ${prompt}`).not.toBeNull();
    const n = Number(match![1]);
    await input.fill(String(n * 11));
    // Auto-submits on correct; Enter would double-commit and end early.
    if (i < 4) await expect(input).toHaveValue("", { timeout: 5_000 });
  }

  await expect(page.getByText(/total time/i)).toBeVisible({ timeout: 10_000 });

  // Wait for the publish POST to actually complete (and succeed) before we
  // read the board, instead of guessing with a fixed delay.
  const resp = await publishResp;
  expect(resp.status(), "leaderboard publish should return 200").toBe(200);

  await page.goto("/leaderboard");
  await expect(page.getByRole("heading", { name: /Top times/i })).toBeVisible();

  // Trick 01 ("Multiplying by 11") is selected by default — that's the trick we drilled.
  // The user should appear on the board, with the "you" badge.
  await expect(page.getByText(displayName).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("text=you").first()).toBeVisible();
});
