/*!
 * parity-npm-charmap.json is the character map from npm slugify 1.6.9,
 * copied as a static rule table. It is not imported as a runtime dependency.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) Simeon Velichkov <simeonvelichkov@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Source: https://github.com/simov/slugify
 */
import npmCharmap from "./parity-npm-charmap.json";
import html4Entities from "./parity-html4-entities.json";
import wpUnfolded from "./parity-wp-unfolded.json";
import type { ParityId } from "./types";

const NPM_CHARMAP = npmCharmap as Record<string, string>;
const HTML4_ENTITIES = html4Entities as Record<string, string>;
const WP_LATIN_UNFOLDED = new Set(wpUnfolded.unfolded);
const WP_KEEP_CASE = new Set(wpUnfolded.keepCase);

// Punctuation and separators whose python-slugify 9.2.0 wrap mid is empty
// (they are dropped, with no dash). Not a transliteration table.
const PYTHON_PUNCT_STRIP = new Set(
  "\u00AD\u055A\u05BE\u05F3\u070F\u0F04\u0F05\u0F06\u0F07\u0F0A\u0F85\u1806\u180A\u180E\u200C\u200D\u200E\u200F\u2018\u2019\u201B\u202A\u202B\u202C\u202D\u202E\u2032\u2033\u2034\u2057\u206A\u206B\u206C\u206D\u206E\u206F\u2768\u2769\u276A\u276B\u276C\u276D\u276E\u276F\u2770\u2771\u2772\u2773\u2774\u2775\u301E\u30FB\uFD3E\uFD3F\uFEFF\uFF07\uFF65",
);
// Punctuation whose real mid is letters or digits, not a dash or a strip.
// Flag these; do not guess the mapping.
const PYTHON_PUNCT_UNSAFE = new Set("\u00A7\u00B6\u0F11\u0F12\u104C\u104D\u104E\u104F\u2030\u2031\u204A\u204B");

// JS NFKD maps U+A7F1 to "S"; Python 3 / Django 6.1.3 leave it, so slugify
// then drops it as non-ASCII. Recorded against Django 6.1.3 on U+00A0..U+FFFF.
const JS_NFKD_SKIP = new Set(["\uA7F1"]);

export const PARITY_VERSIONS: Record<ParityId, string> = {
  wordpress: "7.1.5",
  django: "6.1.3",
  "python-slugify": "9.2.0",
  "npm-slugify": "1.6.9",
};

export const PARITY_NOTES: Record<ParityId, string> = {
  wordpress:
    "matches WordPress 7.1.5 sanitize_title with an English (US) site language, on our test set",
  django: "matches Django 6.1.3 django.utils.text.slugify (allow_unicode=False) on our test set",
  "python-slugify":
    "matches python-slugify 9.2.0 on ASCII, Latin accents that fold, and punctuation from our test set. For non-Latin scripts, use python-slugify directly",
  "npm-slugify": "matches npm slugify 1.6.9 with lower, strict on our test set",
};

export const PARITY_FIXTURE_URL =
  "https://github.com/AtharvaMahamuni/online-slug-generator/blob/main/tests/slug/fixtures/parity.json";

export const PARITY_SAMPLE_TITLES = [
  "How to Prune Roses in June",
  "AT&T fiber plans",
  "Men's Trail Running Shoes (Navy / Size 10)",
  "Node.js 20.0",
  "Straße",
  "Łódź",
  "Привет",
  "東京",
] as const;

export type ParitySlugResult = {
  slug: string;
  unsupported: boolean;
};

/**
 * Values match WP 7.1.5 behaviour; 27 exercised by the fixture (11 of 36 special-case mappings and 16 of 59 encoded codes).
 *
 * Recorded by scripts/gen-parity-fixtures/probe-wp-lists.py, which calls
 * WordPress 7.1.5 remove_accents on individual characters with an English
 * (US) site language. The script does not read WordPress PHP tables.
 * Latin letters here do not fold to ASCII plus combining marks under
 * Unicode NFD. ß maps to s because that is what an English (US) WordPress
 * site produces (Straße becomes strase), not the German ss mapping.
 *
 * Latin-script letters that NFD would fold, but that remove_accents leaves
 * unchanged, are listed in parity-wp-unfolded.json (224 letters, plus 3
 * keep-case exceptions) and are excluded from the NFD pass so they stay
 * percent-encoded like WordPress. IAST titles in the fixture exercise
 * this list.
 */
const WP_LATIN_SPECIALS: Record<string, string> = {
  "£": "",
  "ª": "a",
  "º": "o",
  Æ: "AE",
  Ð: "D",
  Ø: "O",
  Þ: "TH",
  ß: "s",
  æ: "ae",
  ð: "d",
  ø: "o",
  þ: "th",
  Đ: "D",
  đ: "d",
  Ħ: "H",
  ħ: "h",
  ı: "i",
  Ĳ: "IJ",
  ĳ: "ij",
  ĸ: "k",
  Ŀ: "L",
  ŀ: "l",
  Ł: "L",
  ł: "l",
  ŉ: "n",
  Ŋ: "N",
  ŋ: "n",
  Œ: "OE",
  œ: "oe",
  Ŧ: "T",
  ŧ: "t",
  ſ: "s",
  Ə: "E",
  ǝ: "e",
  ɑ: "a",
  "€": "E",
};

/**
 * Values match WP 7.1.5 behaviour; 27 exercised by the fixture (11 of 36 special-case mappings and 16 of 59 encoded codes).
 *
 * After utf8_uri_encode, save-context replacements for percent-encoded forms.
 * Recorded by scripts/gen-parity-fixtures/probe-wp-lists.py, which calls
 * WordPress 7.1.5 sanitize_title on individual characters with an English
 * (US) site language. The script does not read WordPress PHP tables. Raw
 * character replacements would never match after encoding, so the codes are
 * stored in their percent-encoded form.
 */
const WP_ENCODED_TO_HYPHEN = [
  "%c2%a0",
  "%e2%80%80",
  "%e2%80%81",
  "%e2%80%82",
  "%e2%80%83",
  "%e2%80%84",
  "%e2%80%85",
  "%e2%80%86",
  "%e2%80%87",
  "%e2%80%88",
  "%e2%80%89",
  "%e2%80%8a",
  "%e2%80%91",
  "%e2%80%93",
  "%e2%80%94",
  "%e2%80%a8",
  "%e2%80%a9",
  "%e2%80%af",
];

const WP_ENCODED_TO_X = ["%c3%97"];

const WP_ENCODED_STRIP = [
  "%c2%a1",
  "%c2%a9",
  "%c2%ab",
  "%c2%ad",
  "%c2%ae",
  "%c2%b0",
  "%c2%b4",
  "%c2%bb",
  "%c2%bf",
  "%cb%8a",
  "%cc%80",
  "%cc%81",
  "%cc%84",
  "%cc%8c",
  "%cd%81",
  "%e2%80%8b",
  "%e2%80%8c",
  "%e2%80%8d",
  "%e2%80%8e",
  "%e2%80%8f",
  "%e2%80%98",
  "%e2%80%99",
  "%e2%80%9a",
  "%e2%80%9b",
  "%e2%80%9c",
  "%e2%80%9d",
  "%e2%80%9e",
  "%e2%80%9f",
  "%e2%80%a2",
  "%e2%80%a6",
  "%e2%80%aa",
  "%e2%80%ab",
  "%e2%80%ac",
  "%e2%80%ad",
  "%e2%80%ae",
  "%e2%80%b9",
  "%e2%80%ba",
  "%e2%84%a2",
  "%ef%bb%bf",
  "%ef%bf%bc",
];

export function latinAccentsWereFolded(input: string): boolean {
  for (const ch of input) {
    if (WP_LATIN_UNFOLDED.has(ch)) continue;
    const decomposed = ch.normalize("NFD");
    if (decomposed === ch) continue;
    const base = decomposed[0] ?? "";
    if (/\p{Script=Latin}/u.test(base) && /\p{M}/u.test(decomposed.slice(1))) return true;
  }
  return false;
}

export function slugifyParity(title: string, preset: ParityId): string {
  return paritySlug(title, preset).slug;
}

export function paritySlug(title: string, preset: ParityId): ParitySlugResult {
  switch (preset) {
    case "wordpress":
      return { slug: wordpressSlug(title), unsupported: false };
    case "django":
      return { slug: djangoSlug(title), unsupported: false };
    case "python-slugify": {
      const unsupported = pythonHasUnmappedLetters(title);
      return { slug: pythonSlugify(title), unsupported };
    }
    case "npm-slugify":
      return { slug: npmSlugify(title), unsupported: false };
  }
}

function stripTags(input: string): string {
  // PHP strip_tags: a tag starts with < followed by a letter, or with <!, <? or
  // </ and a letter. "< " (less-than plus whitespace) is not a tag.
  return input.replace(/<!--[\s\S]*?-->|<[!?\/][A-Za-z][^>]*>|<\/?[A-Za-z][^>]*>/g, "");
}

function foldWordpressLetters(input: string): string {
  let out = "";
  for (const ch of input) {
    if (Object.hasOwn(WP_LATIN_SPECIALS, ch)) out += WP_LATIN_SPECIALS[ch]!;
    else if (WP_LATIN_UNFOLDED.has(ch)) out += ch;
    else if (/\p{Script=Latin}/u.test(ch)) out += ch.normalize("NFD").replace(/\p{M}/gu, "");
    else out += ch;
  }
  return out;
}

function wordpressLower(input: string): string {
  // Lowercase the whole string so Greek final sigma follows word context,
  // like PHP mb_strtolower. Then put back the 3 letters WordPress 7.1.5
  // does not lowercase (U+A7CE, U+A7D2, U+A7D4).
  const lowered = input.toLocaleLowerCase("en");
  const source = [...input];
  if (!source.some((ch) => WP_KEEP_CASE.has(ch))) return lowered;
  const dest = [...lowered];
  if (source.length !== dest.length) {
    // The keep-case set lowercases 1:1; a length change is unexpected.
    return source.map((ch) => (WP_KEEP_CASE.has(ch) ? ch : ch.toLocaleLowerCase("en"))).join("");
  }
  return source.map((ch, i) => (WP_KEEP_CASE.has(ch) ? ch : dest[i]!)).join("");
}

function utf8UriEncode(input: string, maxLength: number): string {
  const bytes = new TextEncoder().encode(input);
  let out = "";
  let used = 0;
  let i = 0;
  while (i < bytes.length) {
    const value = bytes[i]!;
    if (value < 128) {
      if (used >= maxLength) break;
      out += String.fromCharCode(value);
      used += 1;
      i += 1;
      continue;
    }
    let size = 0;
    if ((value & 0xe0) === 0xc0) size = 2;
    else if ((value & 0xf0) === 0xe0) size = 3;
    else if ((value & 0xf8) === 0xf0) size = 4;
    else {
      i += 1;
      continue;
    }
    if (i + size > bytes.length) break;
    if (used + size * 3 > maxLength) break;
    for (let n = 0; n < size; n += 1) {
      out += `%${bytes[i + n]!.toString(16).padStart(2, "0")}`;
    }
    used += size * 3;
    i += size;
  }
  return out;
}

function applyEncodedReplacements(slug: string): string {
  for (const token of WP_ENCODED_TO_HYPHEN) slug = slug.replaceAll(token, "-");
  for (const token of WP_ENCODED_TO_X) slug = slug.replaceAll(token, "x");
  for (const token of WP_ENCODED_STRIP) slug = slug.replaceAll(token, "");
  return slug;
}

function wordpressSlug(title: string): string {
  let slug = title.replace(/[\uFEFF\uFFFC]/g, "");
  slug = stripTags(slug);
  slug = foldWordpressLetters(slug);
  slug = slug.replace(/%([a-fA-F0-9]{2})/g, "\u0000$1\u0000").replace(/%/g, "").replace(/\u0000([a-fA-F0-9]{2})\u0000/g, "%$1");
  slug = wordpressLower(slug);
  slug = utf8UriEncode(slug, 200);
  slug = applyEncodedReplacements(slug);
  slug = slug.replaceAll("&nbsp;", "-");
  slug = slug.replace(/&.+?;/g, "");
  slug = slug.replaceAll(".", "-");
  slug = slug.replaceAll("/", "-");
  slug = slug.replace(/[^%a-z0-9 _-]/g, "");
  slug = slug.replace(/\s+/g, "-");
  slug = slug.replace(/-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
  return slug;
}

function djangoSlug(title: string): string {
  let slug = "";
  for (const ch of title) slug += JS_NFKD_SKIP.has(ch) ? ch : ch.normalize("NFKD");
  slug = slug.replace(/\p{M}/gu, "");
  slug = [...slug].filter((ch) => ch.charCodeAt(0) < 128).join("");
  slug = slug.toLowerCase();
  slug = slug.replace(/[^A-Za-z0-9_\s-]/g, "");
  slug = slug.trim();
  slug = slug.replace(/[-\s]+/g, "-");
  slug = slug.replace(/^[-_]+/, "").replace(/[-_]+$/, "");
  return slug;
}

function decodeEntities(text: string): string {
  text = text.replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (match, name: string) => {
    const mapped = HTML4_ENTITIES[name];
    return mapped === undefined ? match : mapped;
  });
  text = text.replace(/&#(\d+);/g, (match, digits: string) => {
    const value = Number(digits);
    if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) return match;
    return String.fromCodePoint(value);
  });
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, hex: string) => {
    const value = Number.parseInt(hex, 16);
    if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) return match;
    return String.fromCodePoint(value);
  });
  return text;
}

function pythonPunctStrip(ch: string): boolean {
  if (PYTHON_PUNCT_STRIP.has(ch)) return true;
  const code = ch.codePointAt(0) ?? 0;
  return code === 0xe0001 || (code >= 0x10100 && code <= 0x10102) || (code >= 0xe0020 && code <= 0xe007e);
}

function pythonTransliterate(text: string): string {
  let out = "";
  for (const ch of text) {
    if (pythonPunctStrip(ch)) continue;
    const source = JS_NFKD_SKIP.has(ch) ? ch : ch.normalize("NFKD");
    for (const piece of source) {
      if (/\p{M}/u.test(piece)) continue;
      if (pythonPunctStrip(piece)) continue;
      out += piece;
    }
  }
  return out;
}

// The preset only claims output from an NFKD fold to known pieces, ASCII
// letters and digits, or punctuation and separators verified against
// python-slugify 9.2.0 (strip or dash). Everything else is flagged.
function pythonCharKnown(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  if (code < 128) return true;
  if (JS_NFKD_SKIP.has(ch)) return false;
  if (/\p{M}/u.test(ch)) return false;
  if (pythonPunctStrip(ch)) return true;
  if (PYTHON_PUNCT_UNSAFE.has(ch)) return false;
  const decomposed = JS_NFKD_SKIP.has(ch) ? ch : ch.normalize("NFKD");
  if (decomposed !== ch) {
    const pieces = [...decomposed].filter((piece) => !/\p{M}/u.test(piece) && !pythonPunctStrip(piece));
    // A fold counts only when it yields an ASCII letter or digit. Space or
    // punctuation plus leftover marks is not an NFKD letter fold.
    if (
      pieces.some((piece) => /[A-Za-z0-9]/.test(piece)) &&
      pieces.every((piece) => pythonCharKnown(piece))
    ) {
      return true;
    }
  }
  // Other BMP punctuation, separators and format controls become a dash.
  // Supplementary-plane punctuation is flagged unless it is in the strip set.
  if (code <= 0xffff && /\p{P}|\p{Z}|\p{Cf}/u.test(ch)) return true;
  return false;
}

function pythonHasUnmappedLetters(title: string): boolean {
  // Check the title and the string after HTML4 entity decoding. If the
  // preset does not know a character's real output, flag it and never
  // guess a mapping.
  const decoded = decodeEntities(title);
  for (const ch of title + decoded) {
    if (!pythonCharKnown(ch)) return true;
  }
  return false;
}

function pythonSlugify(title: string): string {
  let text = title.replace(/'+/g, "-");
  text = pythonTransliterate(text);
  text = decodeEntities(text);
  text = text.normalize("NFKD");
  text = text.toLowerCase();
  text = text.replace(/'+/g, "");
  text = text.replace(/(?<=\d),(?=\d)/g, "");
  text = text.replace(/[^-a-zA-Z0-9]+/g, "-");
  text = text.replace(/-{2,}/g, "-").replace(/^-+/, "").replace(/-+$/, "");
  return text;
}

function npmSlugify(title: string): string {
  const replacement = "-";
  let slug = title.normalize().split("").reduce((result, ch) => {
    let append = NPM_CHARMAP[ch];
    if (append === undefined) append = ch;
    if (append === replacement) append = " ";
    return (result + append).replace(/[^\w\s$*_+~.()'"!\-:@]+/g, "");
  }, "");
  slug = slug.replace(/[^A-Za-z0-9\s]/g, "");
  slug = slug.trim();
  slug = slug.replace(/\s+/g, replacement);
  return slug.toLowerCase();
}
