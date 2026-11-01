import { expect, test, type Page } from "@playwright/test";

const sizes = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 360, height: 800 },
  { width: 320, height: 568 },
];

async function assertToolInView(page: Page, copyId: string, titleId: string): Promise<void> {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  for (const id of [titleId, copyId]) {
    const box = await page.locator(id).boundingBox();
    expect(box, id).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(-1);
    expect(box!.y).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
  }
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollY: window.scrollY,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.scrollY).toBe(0);
}

for (const size of sizes) {
  test(`home fits ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    await assertToolInView(page, "#copy", "#title");
    const slug = await page.locator("#slug").boundingBox();
    expect(slug).not.toBeNull();
    expect(slug!.y + slug!.height).toBeLessThanOrEqual(size.height + 1);
  });

  test(`bulk fits ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/bulk-slug-generator");
    await assertToolInView(page, "#copy-all", "#bulk-input");
    const pasteHidden = await page.locator("#panel-paste").isHidden();
    const importHidden = await page.locator("#panel-import").isHidden();
    expect(pasteHidden).toBe(false);
    expect(importHidden).toBe(true);
  });
}

for (const size of sizes) {
  test(`keyboard stand-in keeps copy reachable at ${size.width}x${size.height - 260}`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height - 260 });
    await page.goto("/");
    await expect(page.locator(".definition")).toHaveCount(1);
    const box = await page.locator("#copy").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(size.height - 260 + 1);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });
}

for (const size of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`200% CSS zoom does not clip controls at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    const metrics = await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
      const doc = document.documentElement;
      const zoom = Number(getComputedStyle(doc).zoom) || 1;
      const clipped: string[] = [];
      for (const element of document.querySelectorAll("button, input, textarea, select, a")) {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") continue;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const right = rect.right / zoom;
        const left = rect.left / zoom;
        if (left < -1 || right > doc.clientWidth + 1) {
          clipped.push((element.id || element.textContent || element.tagName).trim().slice(0, 40));
        }
      }
      return {
        scrollWidth: doc.scrollWidth / zoom,
        clientWidth: doc.clientWidth,
        clipped,
      };
    });
    expect(metrics.clipped).toEqual([]);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });
}
