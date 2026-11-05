import { expect, test } from "@playwright/test";
import path from "node:path";

test("single mode types a slug and copies it", async ({ page }) => {
  await page.goto("/");
  await page.locator("#title").fill("Hello World");
  await expect(page.locator("#slug")).toHaveValue("hello-world");
  await page.locator("#copy").click();
  await expect(page.locator("#live")).toHaveText("Copied");
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("hello-world");
});

test("a blank title does not warn that nothing was left to keep", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#title")).toHaveValue("");
  await expect(page.locator("#change-note")).toBeHidden();
  await page.locator("#title").fill("!!!");
  await expect(page.locator("#slug")).toHaveValue("");
  await expect(page.locator("#change-note")).toHaveText("No letters or numbers were left to keep.");
  await page.locator("#title").fill("");
  await expect(page.locator("#change-note")).toBeHidden();
});

test("copy names itself and a tooltip explains the clear button", async ({ page }) => {
  await page.goto("/");
  await page.locator("#title").fill("Hello World");
  await expect(page.locator("#slug")).toHaveValue("hello-world");
  await page.locator("#copy").click();
  await expect(page.locator("#copy")).toHaveText("Copied");
  await expect(page.locator("#live")).toHaveText("Copied");
  await page.locator("#clear").hover();
  await expect(page.locator("#tip")).toHaveText("Erase the title and the slug");
});

test("three lines offer the bulk tool and move the text there", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#bulk-nudge")).toBeHidden();
  await page.locator("#title").fill("Red roses\nWhite roses\nPink roses");
  await expect(page.locator("#bulk-nudge")).toBeVisible();
  await page.locator("#bulk-nudge-open").click();
  await expect(page).toHaveURL(/\/bulk-slug-generator$/);
  await expect(page.locator("#bulk-input")).toHaveValue("Red roses\nWhite roses\nPink roses");
  await expect(page.getByLabel("Slug for row 1")).toHaveValue("red-roses");
  await expect(page.getByLabel("Slug for row 3")).toHaveValue("pink-roses");
});

test("a source column widens from the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/bulk-slug-generator");
  const handle = page.getByRole("slider", { name: "Source column width" });
  const before = await page.locator("#result-table th").nth(1).evaluate((cell) => cell.getBoundingClientRect().width);
  await handle.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const after = await page.locator("#result-table th").nth(1).evaluate((cell) => cell.getBoundingClientRect().width);
  expect(after).toBeGreaterThan(before + 20);
});

test("quick answers are in the HTML and stay in the DOM", async ({ page }) => {
  const response = await page.goto("/");
  const html = (await response?.text()) ?? "";
  expect(html).toContain("What is a URL slug?");
  expect(html).toContain("Does this upload what I paste?");
  expect(html).toContain("Should I use a hyphen or an underscore?");
  await expect(page.locator(".qa details")).toHaveCount(8);
  const first = page.locator(".qa details").first();
  await first.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveJSProperty("open", true);
  await expect(page.locator(".qa details")).toHaveCount(8);
  await page.keyboard.press("Enter");
  await expect(first).toHaveJSProperty("open", false);
});

test("keyboard activates copy", async ({ page }) => {
  await page.goto("/");
  await page.locator("#title").fill("Hello World");
  await expect(page.locator("#slug")).toHaveValue("hello-world");
  await expect(page.locator("#live")).toHaveText("Slug updated");
  await page.locator("#copy").press("Enter");
  await expect(page.locator("#live")).toHaveText("Copied");
});

test("advanced sheet opens and closes from the keyboard", async ({ page }) => {
  await page.goto("/");
  await page.locator("#advanced-open").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#settings-sheet")).toBeVisible();
  await expect(page.locator("#stop-words")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#settings-sheet")).toBeHidden();
  await expect(page.locator("#advanced-open")).toBeFocused();
});

test("theme choice persists across reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#theme-toggle")).toHaveAttribute("aria-label", "Theme: system");
  await page.locator("#theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-choice", "light");
  await expect(page.locator("#theme-toggle")).toHaveAttribute("aria-label", "Theme: light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme-choice", "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator("#theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#theme-toggle")).toHaveAttribute("aria-label", "Theme: dark");
});

test("system theme follows the color scheme", async ({ browser }) => {
  for (const scheme of ["light", "dark"] as const) {
    const context = await browser.newContext({ colorScheme: scheme });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
    await expect(page.locator("html")).toHaveAttribute("data-theme-choice", "system");
    await context.close();
  }
});

test("reduced motion shortens animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const duration = await page.locator("body").evaluate((element) => getComputedStyle(element).animationDuration);
  const seconds = duration.endsWith("ms") ? Number.parseFloat(duration) / 1000 : Number.parseFloat(duration);
  expect(seconds).toBeGreaterThan(0);
  expect(seconds).toBeLessThan(0.001);
});

test("bulk paste marks a duplicate and keeps an edited cell", async ({ page }) => {
  await page.goto("/bulk-slug-generator");
  await page.locator("#bulk-input").fill("Alpha\nAlpha");
  await expect(page.getByLabel("Slug for row 1")).toHaveValue("alpha");
  await expect(page.getByLabel("Slug for row 2")).toHaveValue("alpha-2");
  await expect(page.locator(".state").nth(1)).toHaveText("Duplicate");
  await page.getByLabel("Slug for row 2").fill("alpha-custom");
  await expect(page.getByLabel("Slug for row 2")).toHaveValue("alpha-custom");
  await expect(page.locator(".state").nth(1)).toHaveText("Edited");
});

test("column mapping appears only after a CSV", async ({ page }) => {
  await page.goto("/bulk-slug-generator");
  await page.locator("#tab-import").click();
  await expect(page.locator("#panel-paste")).toBeHidden();
  await expect(page.locator("#csv-controls")).toBeHidden();
  await page.locator("#file").setInputFiles(path.join("tests/e2e/fixtures/titles.txt"));
  await expect(page.locator("#csv-controls")).toBeHidden();
  await expect(page.getByLabel("Slug for row 1")).toHaveValue("how-to-prune-roses-in-june");
  await page.locator("#file").setInputFiles(path.join("tests/e2e/fixtures/products.csv"));
  await expect(page.locator("#csv-controls")).toBeVisible();
  await expect(page.locator("#column")).toHaveValue("1");
  await expect(page.locator("#column option")).toHaveText(["Product ID", "Name", "Category"]);
  await expect(page.getByLabel("Slug for row 1")).toHaveValue("samsung-galaxy-s26");
  await expect(page.getByLabel("Slug for row 2")).toHaveValue("samsung-galaxy-s26-2");
  await expect(page.locator(".state").nth(1)).toHaveText("Duplicate");
});

test("mobile menu reveals Guides", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const summary = page.locator(".nav-menu summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".nav-menu-panel").getByRole("link", { name: "Guides" })).toBeVisible();
});

test("bulk slug input box fills the available cell width", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/bulk-slug-generator");
  await page.locator("#bulk-input").fill("How to Prune Roses in June");
  const cell = page.locator(".slug-cell").first();
  const input = page.getByLabel("Slug for row 1");
  await expect(input).toBeVisible();
  const cellBox = await cell.boundingBox();
  const inputBox = await input.boundingBox();
  expect(cellBox).not.toBeNull();
  expect(inputBox).not.toBeNull();
  // Input should stretch to fill the table cell (accounting for td padding of 8px on each side)
  expect(inputBox!.width).toBeGreaterThanOrEqual(cellBox!.width - 20);
});

test("spanish localized page renders correct headings, lang tag, and ampersand rule", async ({ page }) => {
  await page.goto("/es");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator(".tool-title")).toHaveText("Convierte texto en un slug URL limpio");
  await page.locator("#title").fill("Rosas & Claveles");
  await expect(page.locator("#slug")).toHaveValue("rosas-y-claveles");
});

test("german localized page handles umlauts and und ampersand rule", async ({ page }) => {
  await page.goto("/de");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator(".tool-title")).toHaveText("Text in einen sauberen URL-Slug umwandeln");
  await page.locator("#title").fill("München & Köln");
  await expect(page.locator("#slug")).toHaveValue("muenchen-und-koeln");
});

test("head includes bidirectional hreflang tags for all supported languages", async ({ page }) => {
  await page.goto("/");
  const es = page.locator('link[rel="alternate"][hreflang="es"]');
  const de = page.locator('link[rel="alternate"][hreflang="de"]');
  const xDefault = page.locator('link[rel="alternate"][hreflang="x-default"]');
  await expect(es).toHaveAttribute("href", /https:\/\/onlinesluggenerator\.com\/es$/);
  await expect(de).toHaveAttribute("href", /https:\/\/onlinesluggenerator\.com\/de$/);
  await expect(xDefault).toHaveAttribute("href", "https://onlinesluggenerator.com/");
});
