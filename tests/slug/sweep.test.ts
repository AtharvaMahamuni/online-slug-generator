import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { paritySlug } from "../../src/lib/slug/parity";
import type { ParityId } from "../../src/lib/slug/types";

type SweepPreset = {
  v: string[];
  w: 1 | 2;
  i: string;
  hash?: number;
};

type SweepPlane = {
  count: number;
  presets: Record<ParityId, SweepPreset>;
};

type SweepFile = {
  versions: Record<ParityId, string>;
  wrap: [string, string];
  start: number;
  end: number;
  count: number;
  presets: Record<ParityId, SweepPreset>;
  smp: SweepPlane & { ranges: [number, number][] };
};

const TOKEN_PERCENT = "\u0001";
const TOKEN_PERCENT_LOWER = "\u0002";
const PRESET_IDS: ParityId[] = ["wordpress", "django", "python-slugify", "npm-slugify"];
const PYTHON_HASH_LEN = 12;

function slugHash(slug: string, length = PYTHON_HASH_LEN): string {
  return createHash("sha256").update(slug, "utf8").digest("hex").slice(0, length);
}

function percentEncode(text: string): string {
  return [...new TextEncoder().encode(text)]
    .map((byte) => (byte >= 128 ? `%${byte.toString(16).padStart(2, "0")}` : String.fromCharCode(byte)))
    .join("");
}

function midFromToken(char: string, token: string): string {
  if (token === TOKEN_PERCENT) return percentEncode(char);
  if (token === TOKEN_PERCENT_LOWER) return percentEncode(char.toLowerCase());
  return token;
}

function expectedSlug(prefix: string, suffix: string, char: string, token: string): string {
  const mid = midFromToken(char, token);
  if (mid.startsWith("\u0000")) return mid.slice(1);
  return `${prefix}${mid}${suffix}`;
}

function idsOf(block: SweepPreset, count: number): number[] {
  const bytes = Buffer.from(block.i, "base64");
  const ids: number[] = [];
  if (block.w === 1) {
    expect(bytes.length).toBe(count);
    for (const value of bytes) ids.push(value);
    return ids;
  }
  expect(bytes.length).toBe(count * 2);
  for (let i = 0; i < count; i += 1) ids.push(bytes.readUInt16LE(i * 2));
  return ids;
}

function codepoints(ranges: [number, number][]): string[] {
  const chars: string[] = [];
  for (const [start, end] of ranges) {
    for (let cp = start; cp <= end; cp += 1) {
      if (cp >= 0xd800 && cp <= 0xdfff) continue;
      chars.push(String.fromCodePoint(cp));
    }
  }
  return chars;
}

const fixturePath = path.join(import.meta.dirname, "fixtures/sweep-expected.json.gz");
const sweep = JSON.parse(gunzipSync(readFileSync(fixturePath)).toString("utf8")) as SweepFile;
const bmpChars = codepoints([[sweep.start, sweep.end]]);
const smpChars = codepoints(sweep.smp.ranges);
const [prefix, suffix] = sweep.wrap;

function silentMismatches(
  chars: string[],
  presets: Record<ParityId, SweepPreset>,
): string[] {
  const silent: string[] = [];
  for (const preset of PRESET_IDS) {
    const block = presets[preset];
    const ids = idsOf(block, chars.length);
    for (let i = 0; i < chars.length; i += 1) {
      const char = chars[i]!;
      const title = `${prefix}${char}${suffix}`;
      const token = block.v[ids[i]!]!;
      const result = paritySlug(title, preset);
      const ok = block.hash
        ? slugHash(result.slug, block.hash) === token
        : result.slug === expectedSlug(prefix, suffix, char, token);
      if (!ok && !result.unsupported) {
        const seen = block.hash ? `real#=${token} preset#=${slugHash(result.slug, block.hash)}` : `real=${expectedSlug(prefix, suffix, char, token)}`;
        silent.push(
          `${preset} U+${char.codePointAt(0)!.toString(16).padStart(4, "0")} ${seen} preset=${result.slug}`,
        );
        if (silent.length >= 20) return silent;
      }
    }
  }
  return silent;
}

describe("single-character sweep against committed real-library outputs", () => {
  it("covers U+00A0 to U+FFFF and the harness supplementary ranges, and is not imported by the app bundle", () => {
    expect(bmpChars.length).toBe(sweep.count);
    expect(sweep.count).toBe(63328);
    expect(smpChars.length).toBe(sweep.smp.count);
    expect(sweep.smp.count).toBe(4636);
    expect(sweep.versions).toEqual({
      wordpress: "7.1.5",
      django: "6.1.3",
      "python-slugify": "9.2.0",
      "npm-slugify": "1.6.9",
    });
    const src = readFileSync(path.join(import.meta.dirname, "../../src/lib/slug/parity.ts"), "utf8");
    expect(src).not.toContain("sweep-expected");
    expect(src).not.toContain("tests/slug/fixtures/sweep");
    expect(sweep.presets["python-slugify"].hash).toBe(PYTHON_HASH_LEN);
    expect(sweep.smp.presets["python-slugify"].hash).toBe(PYTHON_HASH_LEN);
    for (const token of sweep.presets["python-slugify"].v) {
      expect(token).toMatch(/^[0-9a-f]{12}$/);
    }
    for (const token of sweep.smp.presets["python-slugify"].v) {
      expect(token).toMatch(/^[0-9a-f]{12}$/);
    }
    expect(sweep.presets.wordpress.hash).toBeUndefined();
    expect(sweep.presets.django.hash).toBeUndefined();
    expect(sweep.presets["npm-slugify"].hash).toBeUndefined();
  });

  it("has no silent mismatch for WordPress, Django, python-slugify or npm slugify on the BMP", () => {
    const silent = silentMismatches(bmpChars, sweep.presets);
    expect(silent, silent.join("\n")).toEqual([]);
  });

  it("has no silent mismatch for WordPress, Django, python-slugify or npm slugify on the supplementary ranges", () => {
    const silent = silentMismatches(smpChars, sweep.smp.presets);
    expect(silent, silent.join("\n")).toEqual([]);
  });
});
