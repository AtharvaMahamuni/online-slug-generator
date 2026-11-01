import { expect, test } from "@playwright/test";

const sizes = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 360, height: 800 },
  { width: 320, height: 568 },
];

const pages = [
  { path: "/", name: "home" },
  { path: "/bulk-slug-generator", name: "bulk" },
];

for (const theme of ["light", "dark"] as const) {
  for (const size of sizes) {
    for (const item of pages) {
      test(`${item.name} ${theme} ${size.width}x${size.height}`, async ({ page }) => {
        await page.addInitScript((choice) => {
          localStorage.setItem("osg.theme", choice);
        }, theme);
        await page.setViewportSize(size);
        await page.goto(item.path);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => {
          const active = document.activeElement;
          if (active instanceof HTMLElement) active.blur();
        });
        await expect(page).toHaveScreenshot(`${item.name}-${theme}-${size.width}x${size.height}.png`, {
          animations: "disabled",
          caret: "hide",
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  }
}
