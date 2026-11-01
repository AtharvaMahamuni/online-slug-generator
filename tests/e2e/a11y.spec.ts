import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const targets = [
  { path: "/", name: "home" },
  { path: "/bulk-slug-generator", name: "bulk" },
  { path: "/guides/what-is-a-url-slug", name: "guide" },
];

for (const scheme of ["light", "dark"] as const) {
  for (const target of targets) {
    test(`axe ${target.name} ${scheme}`, async ({ browser }) => {
      const context = await browser.newContext({ colorScheme: scheme });
      await context.addInitScript((choice) => {
        localStorage.setItem("osg.theme", choice);
      }, scheme);
      const page = await context.newPage();
      await page.goto(target.path);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
      await context.close();
    });
  }
}
