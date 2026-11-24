import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PARITY_FIXTURE_URL, PARITY_SAMPLE_TITLES, slugifyParity } from "../../src/lib/slug/parity";
import { PRESETS, slugify } from "../../src/lib/slug";
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

  it("matches every supported fixture row exactly", () => {
    for (const row of fixture.rows) {
      for (const preset of PRESET_IDS) {
        if (row.unsupported?.includes(preset)) {
          expect(slugifyParity(row.title, preset), `${preset} unsupported for ${row.title}`).not.toBe(row[preset]);
          continue;
        }
        expect(slugify(row.title, PRESETS[preset]).slug, `${preset}: ${row.title}`).toBe(row[preset]);
      }
    }
  });

  it("marks only listed rows as unsupported, and never presents those outputs as a match", () => {
    const unsupported = fixture.rows.filter((row) => row.unsupported?.length);
    expect(unsupported.length).toBeGreaterThan(0);
    for (const row of unsupported) {
      expect(row.unsupported).toContain("python-slugify");
      expect(/\p{Script=Han}/u.test(row.title)).toBe(true);
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
          continue;
        }
        expect(slugify(title, PRESETS[preset]).slug).toBe(row[preset]);
      }
    }
  });
});

describe("home parity table", () => {
  it("prints fixture values, Readable URL defaults, and not matched for unsupported cells", () => {
    const source = readFileSync(path.join(import.meta.dirname, "../../src/pages/index.astro"), "utf8");
    expect(source).toContain('id="parity-table"');
    expect(source).toContain("What WordPress, Django and other slugifiers output");
    expect(source).toContain("PARITY_FIXTURE_URL");
    expect(source).toContain("not matched");
    expect(source).toContain("mens-trail-running-shoes-navy-size-10");
    expect(source).toContain("PARITY_SAMPLE_TITLES");
    expect(PARITY_FIXTURE_URL).toBe(
      "https://github.com/AtharvaMahamuni/online-slug-generator/blob/main/tests/slug/fixtures/parity.json",
    );
  });
});
