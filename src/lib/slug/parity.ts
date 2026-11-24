import npmCharmap from "./parity-npm-charmap.json";
import type { ParityId } from "./types";

const NPM_CHARMAP = npmCharmap as Record<string, string>;

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
 * Latin letters that do not decompose to ASCII plus combining marks under
 * Unicode NFKD. Used by the WordPress preset after a generic NFKD fold.
 * ß maps to s because that is what an English (US) WordPress site produces
 * on our test set (Straße becomes strase), not the German ss mapping.
 * € to E and £ to empty are fixture-observed signs that also do not
 * decompose under NFKD.
 */
const WP_LATIN_SPECIALS: Record<string, string> = {
  ß: "s",
  ẞ: "s",
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
  Œ: "OE",
  œ: "oe",
  Đ: "D",
  đ: "d",
  Ħ: "H",
  ħ: "h",
  ı: "i",
  ĸ: "k",
  Ŀ: "L",
  ŀ: "l",
  ŉ: "n",
  Ŋ: "N",
  ŋ: "n",
  Ŧ: "T",
  ŧ: "t",
  Ə: "E",
  ǝ: "e",
  ɑ: "a",
  "€": "E",
  "£": "",
};

/**
 * After utf8_uri_encode, WordPress save-context replacements observed by
 * running sanitize_title on en_US WordPress 7.1.5. These are percent-encoded
 * forms, not the raw characters (the raw-character replacements would never
 * match after encoding).
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
  "%c2%a3",
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
  Ŋ: "NG",
  ŋ: "NG",
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
  Є: "Ie",
  є: "ie",
  Ґ: "G",
  ґ: "g",
};

// text-unidecode mappings for common signs, applied in the first transliteration pass.
const PYTHON_SYMBOLS: Record<string, string> = {
  "€": "EUR",
  "£": "PS",
  "¥": "Y=",
  "©": "(c)",
  "®": "(r)",
  "™": "tm",
  "°": "deg",
  "×": "x",
  "÷": "/",
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "„": ",,",
  "…": "...",
  "•": "*",
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  copy: "©",
  reg: "®",
  trade: "™",
  euro: "€",
  pound: "£",
  yen: "¥",
  deg: "°",
  times: "×",
  divide: "÷",
};

export function latinAccentsWereFolded(input: string): boolean {
  for (const ch of input) {
    const decomposed = ch.normalize("NFKD");
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
  return input.replace(/<[^>]*>/g, "");
}

function foldWordpressLetters(input: string): string {
  let out = "";
  for (const ch of input) {
    if (Object.hasOwn(WP_LATIN_SPECIALS, ch)) out += WP_LATIN_SPECIALS[ch]!;
    else if (/\p{Script=Latin}/u.test(ch)) out += ch.normalize("NFKD").replace(/\p{M}/gu, "");
    else out += ch;
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
  let slug = stripTags(title);
  slug = foldWordpressLetters(slug);
  slug = slug.replace(/%([a-fA-F0-9]{2})/g, "\u0000$1\u0000").replace(/%/g, "").replace(/\u0000([a-fA-F0-9]{2})\u0000/g, "%$1");
  slug = slug.toLocaleLowerCase("en");
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
  let slug = title.normalize("NFKD").replace(/\p{M}/gu, "");
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
    const mapped = NAMED_ENTITIES[name.toLowerCase()];
    return mapped === undefined ? match : mapped;
  });
  text = text.replace(/&#(\d+);/g, (match, digits: string) => {
    const value = Number(digits);
    if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) return match;
    return String.fromCodePoint(value);
  });
  text = text.replace(/&#[xX]([0-9a-fA-F]+);/g, (match, hex: string) => {
    const value = Number.parseInt(hex, 16);
    if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) return match;
    return String.fromCodePoint(value);
  });
  return text;
}

function pythonMapChar(ch: string): string {
  if (Object.hasOwn(PYTHON_SPECIAL, ch)) return PYTHON_SPECIAL[ch]!;
  if (Object.hasOwn(PYTHON_CYRILLIC, ch)) return PYTHON_CYRILLIC[ch]!;
  if (Object.hasOwn(PYTHON_SYMBOLS, ch)) return PYTHON_SYMBOLS[ch]!;
  return ch;
}

function pythonHasUnmappedLetters(title: string): boolean {
  const decoded = decodeEntities(title);
  for (const ch of decoded.normalize("NFKD")) {
    if (/\p{M}/u.test(ch)) continue;
    if (ch.charCodeAt(0) < 128) continue;
    if (Object.hasOwn(PYTHON_SPECIAL, ch) || Object.hasOwn(PYTHON_CYRILLIC, ch) || Object.hasOwn(PYTHON_SYMBOLS, ch)) {
      continue;
    }
    if (/\p{Script=Latin}/u.test(ch)) continue;
    if (/\p{P}|\p{S}|\p{Z}/u.test(ch)) continue;
    if (/\p{L}|\p{N}/u.test(ch)) return true;
  }
  return false;
}

function pythonSlugify(title: string): string {
  let text = title.replace(/'+/g, "-");
  let mapped = "";
  for (const ch of text.normalize("NFKD")) mapped += pythonMapChar(ch);
  text = decodeEntities(mapped);
  text = text.normalize("NFKD").replace(/\p{M}/gu, "");
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
