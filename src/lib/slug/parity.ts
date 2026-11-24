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
import pythonCheap from "./parity-python-cheap.json";
import type { ParityId } from "./types";

const NPM_CHARMAP = npmCharmap as Record<string, string>;
const HTML4_ENTITIES = html4Entities as Record<string, string>;
const WP_LATIN_UNFOLDED = new Set(wpUnfolded.unfolded);
const WP_KEEP_CASE = new Set(wpUnfolded.keepCase);
const PYTHON_CHEAP: Record<string, string> = {};
[...pythonCheap.keys].forEach((ch, index) => {
  PYTHON_CHEAP[ch] = pythonCheap.values[index]!;
});

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
    "matches python-slugify 9.2.0 on our test set, except Han and other non-Latin scripts",
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

const PYTHON_SPECIAL: Record<string, string> = {
  ß: "ss",
  ẞ: "SS",
  Æ: "AE",
  æ: "ae",
  Ø: "O",
  ø: "o",
  Ð: "D",
  ð: "d",
  Þ: "TH",
  þ: "th",
  Ł: "L",
  ł: "l",
  Đ: "D",
  đ: "d",
  Œ: "OE",
  œ: "oe",
  ı: "i",
  Ħ: "H",
  ħ: "h",
  ĸ: "k",
  Ŀ: "L*",
  ŀ: "l*",
  ŉ: "'n",
  Ŋ: "NG",
  ŋ: "NG",
  Ŧ: "T",
  ŧ: "t",
  ƀ: "b",
  Ɓ: "B",
  ƈ: "c",
  ƌ: "d",
  Ɗ: "D",
  ƒ: "f",
  Ƒ: "F",
  ǥ: "g",
};

const PYTHON_CYRILLIC: Record<string, string> = {
  А: "A",
  Б: "B",
  В: "V",
  Г: "G",
  Д: "D",
  Е: "E",
  Ё: "E",
  Ж: "Zh",
  З: "Z",
  И: "I",
  Й: "I",
  К: "K",
  Л: "L",
  М: "M",
  Н: "N",
  О: "O",
  П: "P",
  Р: "R",
  С: "S",
  Т: "T",
  У: "U",
  Ф: "F",
  Х: "Kh",
  Ц: "Ts",
  Ч: "Ch",
  Ш: "Sh",
  Щ: "Shch",
  Ъ: "",
  Ы: "Y",
  Ь: "",
  Э: "E",
  Ю: "Iu",
  Я: "Ia",
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "iu",
  я: "ia",
  І: "I",
  і: "i",
  Ї: "I",
  ї: "i",
  Є: "E",
  є: "ie",
  Ґ: "G",
  ґ: "g",
};

// text-unidecode mappings for signs and format characters, applied in the first transliteration pass.
const PYTHON_SYMBOLS: Record<string, string> = {
  "€": "EUR",
  "£": "PS",
  "¥": "Y=",
  "¢": "C/",
  "¤": "$?",
  "₹": "[?]",
  "₽": "[?]",
  "₿": "[?]",
  "₤": "L",
  "₩": "W",
  "₪": "NS",
  "₫": "D",
  "©": "(c)",
  "®": "(r)",
  "™": "tm",
  "°": "deg",
  "×": "x",
  "÷": "/",
  "§": "SS",
  "¶": "P",
  "‰": "%0",
  "‱": "%00",
  "¡": "!",
  "¿": "?",
  "«": "<<",
  "»": ">>",
  "±": "+-",
  "µ": "m",
  "¦": "|",
  "¬": "!",
  "·": "*",
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "†": "+",
  "‡": "++",
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "„": ",,",
  "…": "...",
  "•": "*",
  "–": "-",
  "—": "--",
  "\u00a0": " ",
  "\u202f": " ",
  "\u200b": " ",
  "\u200c": "",
  "\u200d": "",
  "\u200e": "",
  "\u200f": "",
  "\u202a": "",
  "\u202b": "",
  "\u202c": "",
  "\u202d": "",
  "\u202e": "",
  "\u00ad": "",
  "\ufeff": "",
  "\ufffc": "",
};

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
  let out = "";
  for (const ch of input) {
    out += WP_KEEP_CASE.has(ch) ? ch : ch.toLocaleLowerCase("en");
  }
  return out;
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

function pythonMapped(ch: string): string | undefined {
  if (Object.hasOwn(PYTHON_SPECIAL, ch)) return PYTHON_SPECIAL[ch];
  if (Object.hasOwn(PYTHON_CYRILLIC, ch)) return PYTHON_CYRILLIC[ch];
  if (Object.hasOwn(PYTHON_SYMBOLS, ch)) return PYTHON_SYMBOLS[ch];
  if (Object.hasOwn(PYTHON_CHEAP, ch)) return PYTHON_CHEAP[ch];
  return undefined;
}

function pythonTransliterate(text: string): string {
  let out = "";
  for (const ch of text) {
    const direct = pythonMapped(ch);
    if (direct !== undefined) {
      out += direct;
      continue;
    }
    const source = JS_NFKD_SKIP.has(ch) ? ch : ch.normalize("NFKD");
    for (const piece of source) {
      if (/\p{M}/u.test(piece)) continue;
      out += pythonMapped(piece) ?? piece;
    }
  }
  return out;
}

// Common combining diacritics that text-unidecode strips. Other marks
// (U+034F..U+035F, combining Latin letters, Hebrew/Arabic points, ...)
// are not guessed: flag them as not matched.
function pythonMarkKnown(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (code >= 0x0300 && code <= 0x034e) || (code >= 0x0360 && code <= 0x0362);
}

function pythonCharKnown(ch: string): boolean {
  if ((ch.codePointAt(0) ?? 0) < 128) return true;
  if (pythonMapped(ch) !== undefined) return true;
  if (JS_NFKD_SKIP.has(ch)) return false;
  if (/\p{M}/u.test(ch)) return pythonMarkKnown(ch);
  const decomposed = ch.normalize("NFKD");
  if (decomposed !== ch && [...decomposed].every((piece) => pythonCharKnown(piece))) return true;
  // Known filter: punctuation, math and other symbols, and separators
  // become a dash. Currency and modifier symbols can transliterate to
  // letters, so they are known only through the tables above.
  if (/\p{P}|\p{Sm}|\p{So}|\p{Z}/u.test(ch)) return true;
  return false;
}

function pythonHasUnmappedLetters(title: string): boolean {
  // Inspect the original title. python-slugify transliterates before it
  // decodes entities, so letters that only appear after entity decoding
  // are stripped the same way in the real library and in this preset.
  // If the preset does not know a character's real output, flag it and
  // never guess a mapping.
  for (const ch of title) {
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
