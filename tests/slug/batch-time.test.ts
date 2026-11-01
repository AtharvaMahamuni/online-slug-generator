import { expect, it } from "vitest";
import { slugify } from "../../src/lib/slug/pipeline";

it("slugifies 10,000 typical titles in under 2 seconds", () => {
  const titles = Array.from({ length: 10_000 }, (_, index) => `How to Prune Roses in June, row ${index}`);
  const start = performance.now();
  for (const title of titles) slugify(title);
  expect(performance.now() - start).toBeLessThan(2_000);
});
