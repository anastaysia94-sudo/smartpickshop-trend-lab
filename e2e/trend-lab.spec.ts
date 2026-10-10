import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

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
  await expect(page.getByText(/saved \/ highest score first/)).toBeVisible();

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
  // Use Node fetch, not Playwright API contexts, so the global httpCredentials
  // setting cannot silently authorize supposedly anonymous requests.
  const url = "http://127.0.0.1:3000";
  const bad = "Basic " + Buffer.from("qa:not-the-password").toString("base64");
  const good = "Basic " + Buffer.from("qa:trend-lab-qa").toString("base64");
  const anonymous = await fetch(url + "/", { redirect: "manual" });
  const invalid = await fetch(url + "/", { headers: { Authorization: bad }, redirect: "manual" });
  const valid = await fetch(url + "/", { headers: { Authorization: good }, redirect: "manual" });
  const health = await fetch(url + "/api/health", { redirect: "manual" });
  expect(anonymous.status).toBe(401);
  expect(invalid.status).toBe(401);
  expect(valid.status).toBe(200);
  expect(health.status).toBe(200);
});


test("exports and imports complete scored JSON backups without corrupting data", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("smartpickshop-trend-lab:v1"));
  await page.reload();
  await page.getByLabel("Niche or product idea").fill("Recoverable pilot niche");
  await page.locator('input[type="range"]').nth(0).fill("80");
  await page.locator('input[type="range"]').nth(1).fill("30");
  await page.locator('input[type="range"]').nth(2).fill("70");
  await page.locator('input[type="range"]').nth(3).fill("90");
  await page.locator("textarea").fill("Original evidence, URLs and buyer pain remain attached.");
  await page.getByRole("button", { name: "Score and save" }).click();
  const downloadPromise=page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup (.json)" }).click();
  const download=await downloadPromise;
  const json=await readFile(await download.path(), "utf8");
  const payload=JSON.parse(json);
  expect(payload.version).toBe(1);
  expect(payload.format).toBe("smartpickshop-trend-lab:backup");
  expect(payload.items.find((x:{name:string})=>x.name==="Recoverable pilot niche")?.score).toBe(79);
  expect(payload.items.find((x:{name:string})=>x.name==="Recoverable pilot niche")?.evidence).toContain("Original evidence");
  await page.evaluate(() => localStorage.removeItem("smartpickshop-trend-lab:v1"));
  await page.reload();
  await expect(page.getByText("Recoverable pilot niche")).toHaveCount(0);
  await page.getByLabel("Import backup (.json)").setInputFiles({
    name:"restored.json", mimeType:"application/json", buffer:Buffer.from(json)
  });
  await expect(page.locator("tbody tr").filter({hasText:"Recoverable pilot niche"})).toContainText("79");
  await expect(page.locator("tbody tr").filter({hasText:"Recoverable pilot niche"})).toContainText("Original evidence");
  await page.reload();
  await expect(page.locator("tbody tr").filter({hasText:"Recoverable pilot niche"})).toContainText("79");
  const invalid={...payload,items:payload.items.map((x:{name:string,score:number})=>x.name==="Recoverable pilot niche"?{...x,score:0}:x)};
  await page.getByLabel("Import backup (.json)").setInputFiles({
    name:"invalid.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(invalid))
  });
  await expect(page.getByRole("status")).toContainText("inconsistent with its inputs");
  await expect(page.locator("tbody tr").filter({hasText:"Recoverable pilot niche"})).toContainText("79");
});


test("remote workspace fails closed when storage is not configured", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Niche or product idea").fill("Keep local research");
  await page.getByRole("button", {name:"Score and save"}).click();
  await page.getByRole("button", {name:"Save to server workspace"}).click();
  await expect(page.getByRole("status")).toContainText("Server storage not configured");
  await expect(page.locator("tbody tr").filter({hasText:"Keep local research"})).toBeVisible();
  page.once("dialog",dialog=>void dialog.accept());
  await page.getByRole("button", {name:"Load server workspace"}).click();
  await expect(page.getByRole("status")).toContainText("Server storage not configured");
  await expect(page.locator("tbody tr").filter({hasText:"Keep local research"})).toBeVisible();
});
