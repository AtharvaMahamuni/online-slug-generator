import { describe, expect, it } from "vitest";
import { slugify, slugifyBatch } from "../../src/lib/slug/pipeline";
import { DEFAULT_CONFIG } from "../../src/lib/slug/presets";
import type { SlugConfig } from "../../src/lib/slug/types";

function cfg(patch: Partial<SlugConfig> = {}): SlugConfig {
  return { ...DEFAULT_CONFIG, ...patch };
}

describe("slug pipeline", () => {
  it("turns Hello World into hello-world", () => {
    expect(slugify("Hello World").slug).toBe("hello-world");
  });

  it("trims leading and trailing space", () => {
    expect(slugify("  Hello World  ").slug).toBe("hello-world");
  });

  it("collapses repeated spaces into one separator", () => {
    expect(slugify("Hello   World").slug).toBe("hello-world");
  });

  it("drops punctuation", () => {
    expect(slugify("Hello, world!").slug).toBe("hello-world");
  });

  it("replaces an ampersand when the rule is on", () => {
    expect(slugify("AT&T").slug).toBe("at-and-t");
    expect(slugify("AT&T", cfg({ ampersandToAnd: false })).slug).toBe("at-t");
  });

  it("folds Latin accents", () => {
    expect(slugify("Café").slug).toBe("cafe");
    expect(slugify("Café").flags.transliterated).toBe(true);
  });

  it("folds Straße to strasse", () => {
    expect(slugify("Straße").slug).toBe("strasse");
  });

  it("keeps Cyrillic under both letter policies", () => {
    expect(slugify("Привет").slug).toBe("привет");
    expect(slugify("Привет", cfg({ letterPolicy: "preserve" })).slug).toBe("привет");
  });

  it("keeps CJK text", () => {
    expect(slugify("東京").slug).toBe("東京");
    expect(slugify("東京", cfg({ letterPolicy: "preserve" })).slug).toBe("東京");
  });

  it("returns an empty slug for emoji only", () => {
    const result = slugify("🎉");
    expect(result.slug).toBe("");
    expect(result.flags.empty).toBe(true);
  });

  it("returns an empty slug for empty input without throwing", () => {
    expect(slugify("").slug).toBe("");
    expect(slugify("   ").slug).toBe("");
  });

  it("keeps a 400-character title when max length is empty", () => {
    const title = Array.from({ length: 80 }, (_, index) => `word${index}`).join(" ");
    const result = slugify(title);
    expect([...title].length).toBeGreaterThanOrEqual(400);
    expect(result.flags.truncated).toBe(false);
    expect(result.slug).toBe(title.toLocaleLowerCase("en").replaceAll(" ", "-"));
  });

  it("cuts maxLength on a separator", () => {
    const result = slugify("one two three four five six", cfg({ maxLength: 20 }));
    expect(result.slug).toBe("one-two-three-four");
    expect(result.flags.truncated).toBe(true);
    expect(result.slug.endsWith("-")).toBe(false);
    expect([...result.slug].length).toBeLessThanOrEqual(20);
  });

  it("hard-cuts a first token that is longer than maxLength", () => {
    const result = slugify("abcdefghijklmnopqrstuvwxyz", cfg({ maxLength: 5 }));
    expect(result.slug).toBe("abcde");
    expect(result.flags.truncated).toBe(true);
  });

  it("removes stop words only when asked", () => {
    expect(slugify("The Art of War", cfg({ stopWords: true })).slug).toBe("art-war");
    expect(slugify("The Art of War", cfg({ stopWords: false })).slug).toBe("the-art-of-war");
    expect(slugify("The", cfg({ stopWords: true })).slug).toBe("the");
  });

  it("keeps numbers unless removal is on", () => {
    expect(slugify("iPhone 17 Pro").slug).toBe("iphone-17-pro");
    expect(slugify("iPhone 17 Pro", cfg({ removeNumbers: true })).slug).toBe("iphone-pro");
    expect(slugify("iPhone 17 Pro", cfg({ removeNumbers: true })).flags.numbersRemoved).toBe(true);
  });

  it("suffixes duplicate slugs", () => {
    const rows = slugifyBatch(["A", "A"]);
    expect(rows.map((row) => row.slug)).toEqual(["a", "a-2"]);
    expect(rows[1]?.duplicate).toBe(true);
  });

  it("skips a suffix that already exists", () => {
    const rows = slugifyBatch(["A", "A", "a-2"]);
    expect(rows.map((row) => row.slug)).toEqual(["a", "a-3", "a-2"]);
  });

  it("uses the underscore separator", () => {
    expect(slugify("Hello World", cfg({ separator: "_" })).slug).toBe("hello_world");
    const rows = slugifyBatch(["A", "A"], cfg({ separator: "_" }));
    expect(rows.map((row) => row.slug)).toEqual(["a", "a_2"]);
  });

  it("treats NBSP as space and drops zero-width characters", () => {
    expect(slugify("Hello\u00A0World").slug).toBe("hello-world");
    expect(slugify("Hello\u200BWorld").slug).toBe("helloworld");
    expect(slugify("Hello\u200C \uFEFFWorld").slug).toBe("hello-world");
  });

  it("is deterministic", () => {
    const input = "Café & Straße — The Art of War";
    expect(slugify(input)).toEqual(slugify(input));
  });

  it("warns when a duplicate suffix exceeds maxLength and keeps the suffix", () => {
    const rows = slugifyBatch(["Hello there friend", "Hello there friend"], cfg({ maxLength: 18 }));
    expect(rows[0]?.slug).toBe("hello-there-friend");
    expect(rows[1]?.slug).toBe("hello-there-friend-2");
    expect(rows[1]?.lengthWarning).toBe(true);
    expect(rows[1]?.flags.truncated).toBe(false);
  });

  it("keeps lowercase off when that flag is flipped", () => {
    expect(slugify("Hello World", cfg({ lowercase: false })).slug).toBe("Hello-World");
  });

  it("preserves Latin accents when asked", () => {
    expect(slugify("Café", cfg({ letterPolicy: "preserve" })).slug).toBe("café");
    expect(slugify("Café", cfg({ letterPolicy: "preserve" })).flags.transliterated).toBe(false);
  });
});
