import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { changeNote, PRESETS, slugify } from "../../src/lib/slug";
import { PARITY_FIXTURE_URL, PARITY_SAMPLE_TITLES, slugifyParity } from "../../src/lib/slug/parity";
import type { ParityId } from "../../src/lib/slug/types";

type ParityRow = {
  title: string;
  wordpress: string;
  django: string;
  "python-slugify": string;
  "npm-slugify": string;
  unsupported?: string[];
};

type Fixture = {
  versions: Record<ParityId, string>;
  rows: ParityRow[];
};

const fixture = JSON.parse(
  readFileSync(path.join(import.meta.dirname, "fixtures/parity.json"), "utf8"),
) as Fixture;

const PRESET_IDS: ParityId[] = ["wordpress", "django", "python-slugify", "npm-slugify"];

describe("parity presets", () => {
  it("has at least 25 published titles from the real libraries", () => {
    expect(fixture.rows.length).toBeGreaterThanOrEqual(25);
    expect(fixture.versions).toEqual({
      wordpress: "7.1.5",
      django: "6.1.3",
      "python-slugify": "9.2.0",
      "npm-slugify": "1.6.9",
    });
  });

  it("matches every supported fixture row exactly, and shows not matched when it cannot", () => {
    for (const row of fixture.rows) {
      for (const preset of PRESET_IDS) {
        const raw = slugifyParity(row.title, preset);
        const displayed = slugify(row.title, PRESETS[preset]).slug;
        if (row.unsupported?.includes(preset)) {
          const result = slugify(row.title, PRESETS[preset]);
          expect(raw, `${preset} unsupported for ${row.title}`).not.toBe(row[preset]);
          expect(displayed, `${preset} display for ${row.title}`).toBe("");
          expect(result.flags.unmatched, `${preset} unmatched for ${row.title}`).toBe(true);
          expect(changeNote(result)).toBe("Not matched");
          continue;
        }
        expect(raw, `${preset}: ${row.title}`).toBe(row[preset]);
        expect(displayed, `${preset} display: ${row.title}`).toBe(row[preset]);
      }
    }
  });

  it("covers slash, dash, curly quote, entity, non-Han script and digit-comma rows", () => {
    const titles = fixture.rows.map((row) => row.title);
    expect(titles).toEqual(expect.arrayContaining([
      "AC/DC Back in Black",
      "2026/27 season preview",
      "Title—Subtitle",
      "John’s guide",
      "Ben &amp; Jerry",
      "1,000 rows",
      "Ελληνικά νέα",
      "Fußball ẞig",
      "5 < 6 > 4",
      "&eacute;cole",
      "§ 12",
      "‰ permille",
      "ŉ test",
      "ɐ ə ɛ",
    ]));
    expect(titles.some((title) => title.includes("\ufeff"))).toBe(true);
    expect(titles.some((title) => title.includes("\u00ad"))).toBe(true);
    expect(titles.some((title) => title.includes("\u2011"))).toBe(true);
    expect(titles.some((title) => title.includes("<b>"))).toBe(true);
    const comma = fixture.rows.find((row) => row.title === "1,000 rows");
    expect(comma?.["python-slugify"]).toBe("1000-rows");
  });

  it("marks unsupported from a real-versus-preset diff, including non-Han scripts", () => {
    const unsupported = fixture.rows.filter((row) => row.unsupported?.length);
    expect(unsupported.length).toBeGreaterThan(0);
    expect(unsupported.some((row) => /\p{Script=Han}/u.test(row.title))).toBe(true);
    expect(unsupported.some((row) => /\p{Script=Greek}/u.test(row.title))).toBe(true);
    for (const row of unsupported) {
      expect(row.unsupported).toContain("python-slugify");
    }
  });

  it("keeps the home table sample titles equal to the published fixture rows", () => {
    expect(PARITY_SAMPLE_TITLES).toHaveLength(8);
    for (const title of PARITY_SAMPLE_TITLES) {
      const row = fixture.rows.find((item) => item.title === title);
      expect(row, title).toBeTruthy();
      if (!row) continue;
      expect(slugify(title, PRESETS.readable).slug).toBe(slugify(title).slug);
      for (const preset of PRESET_IDS) {
        if (row.unsupported?.includes(preset)) {
          expect(row[preset]).not.toBe("not matched");
          const result = slugify(title, PRESETS[preset]);
          expect(result.slug).toBe("");
          expect(result.flags.unmatched).toBe(true);
          continue;
        }
        expect(slugify(title, PRESETS[preset]).slug).toBe(row[preset]);
      }
    }
  });

  it("sets the Latin-accents note only when accents were folded", () => {
    const shoes = slugify("Men's Trail Running Shoes", PRESETS.wordpress);
    expect(shoes.slug).toBe("mens-trail-running-shoes");
    expect(shoes.flags.transliterated).toBe(false);
    expect(changeNote(shoes)).toBe("");
    const cafe = slugify("Café au lait", PRESETS.wordpress);
    expect(cafe.slug).toBe("cafe-au-lait");
    expect(cafe.flags.transliterated).toBe(true);
    expect(changeNote(cafe)).toBe("Latin accents were folded to ASCII.");
  });
});


  it("matches the widened WordPress and python-slugify cases", () => {
    const python = PRESETS["python-slugify"];
    expect(slugify("&rsquo;s", python).slug).toBe("s");
    expect(slugify("&mdash;dash", python).slug).toBe("dash");
    expect(slugify("&ndash;", python).slug).toBe("");
    expect(slugify("&hellip;more", python).slug).toBe("more");
    expect(slugify("&eacute;cole", python).slug).toBe("e-cole");
    expect(slugify("§ 12", python).slug).toBe("ss-12");
    expect(slugify("¶ para", python).slug).toBe("p-para");
    expect(slugify("¢ ¥ ₹ ₽ ₿", python).slug).toBe("c-y");
    expect(slugify("‰ permille", python).slug).toBe("0-permille");
    expect(slugify("soft\u00adhyphen", python).slug).toBe("softhyphen");
    expect(slugify("a\u200cb", python).slug).toBe("ab");
    expect(slugify("\ufeffabc", python).slug).toBe("abc");
    expect(slugify("ŉ test", python).slug).toBe("n-test");
    expect(slugify("ŉ test", python).flags.unmatched).toBe(false);
    expect(slugify("ɐ ə ɛ", python).flags.unmatched).toBe(true);
    expect(slugify("ɐ ə ɛ", python).slug).toBe("");

    const wordpress = PRESETS.wordpress;
    expect(slugify("Fußball ẞig", wordpress).slug).toBe("fusball-%c3%9fig");
    expect(slugify("bom\ufeffhere", wordpress).slug).toBe("bomhere");
    expect(slugify("obj\ufffchere", wordpress).slug).toBe("objhere");
    expect(slugify("5 < 6 > 4", wordpress).slug).toBe("5-6-4");
    expect(slugify("ﬁ ﬂ ﬃ", wordpress).slug).toBe("%ef%ac%81-%ef%ac%82-%ef%ac%83");
  });

describe("home parity table", () => {
  it("prints fixture values, Readable URL defaults, not matched, and (empty)", () => {
    const source = readFileSync(path.join(import.meta.dirname, "../../src/pages/index.astro"), "utf8");
    expect(source).toContain('id="parity-table"');
    expect(source).toContain("What WordPress, Django and other slugifiers output");
    expect(source).toContain("PARITY_FIXTURE_URL");
    expect(source).toContain("not matched");
    expect(source).toContain("(empty)");
    expect(source).toContain("mens-trail-running-shoes-navy-size-10");
    expect(source).toContain("PARITY_SAMPLE_TITLES");
    expect(PARITY_FIXTURE_URL).toBe(
      "https://github.com/AtharvaMahamuni/online-slug-generator/blob/main/tests/slug/fixtures/parity.json",
    );
  });
});
