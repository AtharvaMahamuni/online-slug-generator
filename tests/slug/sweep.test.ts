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
};

type SweepFile = {
  versions: Record<ParityId, string>;
  wrap: [string, string];
  start: number;
  end: number;
  count: number;
  presets: Record<ParityId, SweepPreset>;
};

const TOKEN_PERCENT = "\u0001";
const TOKEN_PERCENT_LOWER = "\u0002";

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

function codepoints(start: number, end: number): string[] {
  const chars: string[] = [];
  for (let cp = start; cp <= end; cp += 1) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    chars.push(String.fromCodePoint(cp));
  }
  return chars;
}

const fixturePath = path.join(import.meta.dirname, "fixtures/sweep-expected.json.gz");
const sweep = JSON.parse(gunzipSync(readFileSync(fixturePath)).toString("utf8")) as SweepFile;
const chars = codepoints(sweep.start, sweep.end);
const [prefix, suffix] = sweep.wrap;

describe("single-character sweep against committed real-library outputs", () => {
  it("covers U+00A0 to U+FFFF and is not imported by the app bundle", () => {
    expect(chars.length).toBe(sweep.count);
    expect(sweep.count).toBe(63328);
    expect(sweep.versions).toEqual({
      wordpress: "7.1.5",
      django: "6.1.3",
      "python-slugify": "9.2.0",
      "npm-slugify": "1.6.9",
    });
    const src = readFileSync(path.join(import.meta.dirname, "../../src/lib/slug/parity.ts"), "utf8");
    expect(src).not.toContain("sweep-expected");
    expect(src).not.toContain("tests/slug/fixtures/sweep");
  });

  it("has no silent mismatch for WordPress, Django or npm slugify", () => {
    const checked: ParityId[] = ["wordpress", "django", "npm-slugify"];
    const silent: string[] = [];
    for (const preset of checked) {
      const block = sweep.presets[preset];
      const ids = idsOf(block, chars.length);
      for (let i = 0; i < chars.length; i += 1) {
        const char = chars[i]!;
        const title = `${prefix}${char}${suffix}`;
        const expected = expectedSlug(prefix, suffix, char, block.v[ids[i]!]!);
        const result = paritySlug(title, preset);
        if (result.slug !== expected && !result.unsupported) {
          silent.push(`${preset} U+${char.codePointAt(0)!.toString(16).padStart(4, "0")} real=${expected} preset=${result.slug}`);
          if (silent.length >= 20) break;
        }
      }
    }
    expect(silent, silent.join("\n")).toEqual([]);
  });
});
