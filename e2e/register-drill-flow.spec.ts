import { expect, test } from "@playwright/test";

/**
 * End-to-end happy path: register a fresh user, complete a 5-question drill
 * on trick 01 (Multiplying by 11), land on the results page, and verify the
 * recent activity entry appears on the home screen.
 *
 * Prereq: the Firebase emulator suite must be running:
 *   npm run emulators
 * (CI uses `npm run e2e:emulators` which wraps Playwright in
 *  `firebase emulators:exec`.)
 */
test("register → drill → results → home shows the drill", async ({ page }) => {
  await page.goto("/login");

  // Switch to register
  await page.getByRole("button", { name: "Create account" }).first().click();

  const email = `tester-${Date.now()}@example.com`;
  await page.getByPlaceholder("Sam Park").fill("Sam Park");
  await page.getByPlaceholder("you@school.edu").fill(email);
  await page.getByPlaceholder(/min 6/).fill("hunter2");
  await page.getByPlaceholder("St. Mark's").fill("St. Mark's");

  // Submit the register form. Target the submit button by class — the string
  // "Create account" also matches the mode-toggle tab above the form.
  await page.locator("button.login-submit-btn").click();

  // Land on home
  await expect(page.getByRole("heading", { name: /Eighty problems/ })).toBeVisible({
    timeout: 15_000,
  });

  // Click trick 01
  await page.getByText("Multiplying by 11").first().click();

  // Drill page — answer 5 problems. We compute answers from the visible prompt.
  const input = page.locator("input.drill-input");
  for (let i = 0; i < 5; i++) {
    await expect(page.locator(".drill-problem")).toBeVisible();
    const prompt = await page.locator(".drill-problem").innerText();
    // Prompts of trick 01 always look like "<n> × 11"; parse n and compute.
    const match = prompt.match(/(\d+)\s*[×x]\s*11/);
    expect(match, `prompt #${i + 1} did not match expected pattern: ${prompt}`).not.toBeNull();
    const n = Number(match![1]);
    await input.fill(String(n * 11));
    // The drill auto-submits the instant a correct answer is typed — pressing
    // Enter here would double-commit and end the drill early. The input clears
    // on commit; for the last question the app navigates to results instead.
    if (i < 4) await expect(input).toHaveValue("", { timeout: 5_000 });
  }

  // Results page
  await expect(page.getByText(/total time/i)).toBeVisible({ timeout: 10_000 });

  // Back to home
  await page.getByRole("button", { name: /Back to tricks/i }).click();
  await expect(page.getByText(/Recent activity/i)).toBeVisible();
  await expect(page.locator("text=Multiplying by 11").first()).toBeVisible();
});
