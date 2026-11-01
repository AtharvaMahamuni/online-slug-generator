import { describe, expect, it } from "vitest";
import { slugify } from "../../src/lib/slug/pipeline";
import { PRESETS } from "../../src/lib/slug/presets";
import type { SlugConfig } from "../../src/lib/slug/types";

describe("published examples", () => {
  it("matches the home table", () => {
    const rows: Array<[string, string, string]> = [
      ["How to Prune Roses in June", "how-to-prune-roses-in-june", "how-prune-roses-june"],
      ["Café au lait, 12 oz", "cafe-au-lait-12-oz", "cafe-au-lait-12-oz"],
      ["AT&T fiber plans", "at-and-t-fiber-plans", "t-fiber-plans"],
    ];
    for (const [title, readable, short] of rows) {
      expect(slugify(title, PRESETS.readable).slug).toBe(readable);
      expect(slugify(title, PRESETS.short).slug).toBe(short);
    }
  });

  it("matches the unicode guide table", () => {
    expect(slugify("Café", PRESETS.readable).slug).toBe("cafe");
    expect(slugify("Café", PRESETS.preserve).slug).toBe("café");
    expect(slugify("Straße", PRESETS.readable).slug).toBe("strasse");
    expect(slugify("Straße", PRESETS.preserve).slug).toBe("straße");
    expect(slugify("Привет", PRESETS.readable).slug).toBe("привет");
    expect(slugify("Привет", PRESETS.preserve).slug).toBe("привет");
    expect(slugify("東京", PRESETS.readable).slug).toBe("東京");
    expect(slugify("東京", PRESETS.preserve).slug).toBe("東京");
    expect(slugify("Café au lait", PRESETS.preserve).slug).toBe("café-au-lait");
    expect(slugify("Café in 東京, 12", PRESETS.readable).slug).toBe("cafe-in-東京-12");
  });

  it("turns an ampersand into a separator when the and-rule is off", () => {
    const config: SlugConfig = { ...PRESETS.readable, ampersandToAnd: false };
    expect(slugify("AT&T fiber plans", config).slug).toBe("at-t-fiber-plans");
    expect(slugify("AT&T", PRESETS.readable).slug).toBe("at-and-t");
  });
});
