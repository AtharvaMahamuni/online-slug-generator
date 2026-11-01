import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("engine boundaries", () => {
  it("does not import the DOM, localStorage, or Astro", () => {
    const dir = join(process.cwd(), "src/lib/slug");
    const files = readdirSync(dir).filter((file) => file.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(join(dir, file), "utf8");
      expect(source).not.toMatch(/\b(document|window|localStorage|sessionStorage|DOMParser|astro)\b/);
    }
  });
});
