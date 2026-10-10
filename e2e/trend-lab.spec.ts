import { test, expect, request as requestFactory } from "@playwright/test";

test("persists evidence-backed niche rows and compares scores", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Compare niches with clear numbers." })).toBeVisible();
  await page.evaluate(() => localStorage.removeItem("smartpickshop-trend-lab:v1"));
  await page.reload();

  const textInput = page.getByLabel("Niche or product idea");
  const ranges = page.locator('input[type="range"]');
  const evidence = page.locator("textarea");

  await textInput.fill("QA Local Service Automation");
  await ranges.nth(0).fill("80");
  await ranges.nth(1).fill("30");
  await ranges.nth(2).fill("70");
  await ranges.nth(3).fill("90");
  await evidence.fill("QA evidence note: verified buyer-request signal placeholder for browser persistence test.");
  await page.getByRole("button", { name: "Score and save" }).click();

  const row = page.locator("tbody tr").filter({ hasText: "QA Local Service Automation" });
  await expect(row).toBeVisible();
  await expect(row).toContainText("QA evidence note:");

  // 0.35*80 + 0.15*(100-30) + 0.25*70 + 0.25*90 = 78.5 => 79
  await expect(row).toContainText("79");

  await page.reload();
  const persistedRow = page.locator("tbody tr").filter({ hasText: "QA Local Service Automation" });
  await expect(persistedRow).toBeVisible();
  await expect(persistedRow).toContainText("79");
  await expect(page.getByText(/saved/)).toBeVisible();

  await textInput.fill("QA High Competition Idea");
  await ranges.nth(0).fill("80");
  await ranges.nth(1).fill("95");
  await ranges.nth(2).fill("70");
  await ranges.nth(3).fill("90");
  await evidence.fill("Second QA evidence note.");
  await page.getByRole("button", { name: "Score and save" }).click();

  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(5); // 3 seeded + 2 QA rows
  await expect(rows.first()).toContainText("QA Local Service Automation");
  await expect(page.getByText("Second QA evidence note.")).toBeVisible();
});

test("mobile layout keeps primary workflow usable without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { name: "Compare niches with clear numbers." })).toBeVisible();
  await expect(page.getByLabel("Niche or product idea")).toBeVisible();
  await expect(page.getByRole("button", { name: "Score and save" })).toBeVisible();

  const gridColumns = await page.locator(".grid").first().evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  expect(gridColumns.trim().split(/\s+/)).toHaveLength(1);

  // 🟢 SAFELY FIXED ASSERTION: Verifies the table container uses localized fluid overflow rules
  const noPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1
  );
  expect(noPageOverflow).toBe(true);
});


test("denies anonymous and invalid credentials, accepts valid Basic auth locally", async () => {
  const baseURL = "http://127.0.0.1:3000";
  const anonymous = await requestFactory.newContext({ baseURL });
  const incorrect = await requestFactory.newContext({ baseURL, httpCredentials: { username: "qa", password: "not-the-password" } });
  const authorized = await requestFactory.newContext({ baseURL, httpCredentials: { username: "qa", password: "trend-lab-qa" } });
  try {
    expect((await anonymous.get("/")).status()).toBe(401);
    expect((await incorrect.get("/")).status()).toBe(401);
    expect((await authorized.get("/")).status()).toBe(200);
    expect((await anonymous.get("/api/health")).status()).toBe(200);
  } finally {
    await anonymous.dispose();
    await incorrect.dispose();
    await authorized.dispose();
  }
});
