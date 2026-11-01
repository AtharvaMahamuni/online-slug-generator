import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, PRESETS, sameConfig } from "../../src/lib/slug/presets";
import { defaultSettings, parseStoredJson, parseStoredSettings } from "../../src/lib/slug/settings";
import { slugify } from "../../src/lib/slug/pipeline";
import type { SlugConfig } from "../../src/lib/slug/types";

describe("presets and stored settings", () => {
  it("matches the Readable URL, Short permalink, and Keep original script table", () => {
    expect(PRESETS.readable).toEqual({
      separator: "-",
      lowercase: true,
      letterPolicy: "latin-ascii",
      stopWords: false,
      removeNumbers: false,
      ampersandToAnd: true,
      maxLength: null,
      locale: "en",
    });
    expect(PRESETS.short).toEqual({ ...PRESETS.readable, stopWords: true, maxLength: 60 });
    expect(PRESETS.preserve).toEqual({ ...PRESETS.readable, letterPolicy: "preserve", lowercase: true });
    expect(sameConfig(DEFAULT_CONFIG, PRESETS.readable)).toBe(true);
  });

  it("changes output when each flag is flipped alone", () => {
    const input = "The Café & Co 17";
    const cases: Array<[Partial<SlugConfig>, string]> = [
      [{ separator: "_" }, "the_cafe_and_co_17"],
      [{ lowercase: false }, "The-Cafe-and-Co-17"],
      [{ letterPolicy: "preserve" }, "the-café-and-co-17"],
      [{ stopWords: true }, "cafe-co-17"],
      [{ removeNumbers: true }, "the-cafe-and-co"],
      [{ ampersandToAnd: false }, "the-cafe-co-17"],
      [{ maxLength: 12 }, "the-cafe-and"],
    ];
    const baseline = slugify(input).slug;
    expect(baseline).toBe("the-cafe-and-co-17");
    for (const [patch, expected] of cases) {
      expect(slugify(input, { ...DEFAULT_CONFIG, ...patch }).slug).toBe(expected);
    }
  });

  it("resets to the readable defaults", () => {
    expect(defaultSettings().config).toEqual(DEFAULT_CONFIG);
    expect(defaultSettings().preset).toBe("readable");
    expect(defaultSettings().urlPreview).toBe(false);
  });

  it("ignores an unknown settings version", () => {
    const parsed = parseStoredSettings({ version: 2, config: { ...DEFAULT_CONFIG, separator: "_" } });
    expect(parsed.config).toEqual(DEFAULT_CONFIG);
    expect(parseStoredJson('{"version":99}')).toEqual(defaultSettings());
  });

  it("accepts a valid version 1 payload", () => {
    const parsed = parseStoredJson(
      JSON.stringify({
        version: 1,
        config: { ...DEFAULT_CONFIG, separator: "_" },
        preset: "custom",
        urlPreview: true,
        urlPrefix: "https://example.com/blog",
      }),
    );
    expect(parsed.config.separator).toBe("_");
    expect(parsed.preset).toBe("custom");
    expect(parsed.urlPreview).toBe(true);
    expect(parsed.urlPrefix).toBe("https://example.com/blog");
  });

  it("rejects a payload that is not an object", () => {
    expect(parseStoredSettings(null)).toEqual(defaultSettings());
    expect(parseStoredJson("not-json")).toEqual(defaultSettings());
  });
});
