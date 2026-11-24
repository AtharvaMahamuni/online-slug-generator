import npmCharmap from "./parity-npm-charmap.json";
import wordpressAccents from "./parity-wordpress-accents.json";
import type { ParityId } from "./types";

const WP_EXCEPTIONS = wordpressAccents.exceptions as Record<string, string>;
const WP_FOLD = new Set([...wordpressAccents.fold]);
const NPM_CHARMAP = npmCharmap as Record<string, string>;

export const PARITY_VERSIONS: Record<ParityId, string> = {
  wordpress: "7.1.5",
  django: "6.1.3",
  "python-slugify": "9.2.0",
  "npm-slugify": "1.6.9",
};

export const PARITY_NOTES: Record<ParityId, string> = {
  wordpress: "matches WordPress 7.1.5 sanitize_title on our test set",
  django: "matches Django 6.1.3 django.utils.text.slugify on our test set",
  "python-slugify": "matches python-slugify 9.2.0 on our test set",
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
  Ŋ: "N",
  ŋ: "ng",
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

export function slugifyParity(title: string, preset: ParityId): string {
  switch (preset) {
    case "wordpress":
      return wordpressSlug(title);
    case "django":
      return djangoSlug(title);
    case "python-slugify":
      return pythonSlugify(title);
    case "npm-slugify":
      return npmSlugify(title);
  }
}

function removeAccentsWordpress(input: string): string {
  let out = "";
  for (const ch of input) {
    if (Object.hasOwn(WP_EXCEPTIONS, ch)) out += WP_EXCEPTIONS[ch];
    else if (WP_FOLD.has(ch)) out += ch.normalize("NFKD").replace(/\p{M}/gu, "");
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


function dropEncodedPunctuation(slug: string): string {
  return slug.replace(/(?:%[0-9a-f]{2})+/g, (encoded) => {
    const bytes = new Uint8Array(
      [...encoded.matchAll(/%([0-9a-f]{2})/g)].map((match) => Number.parseInt(match[1]!, 16)),
    );
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if ([...text].every((ch) => /\p{L}|\p{N}/u.test(ch))) return encoded;
    } catch {
      return encoded;
    }
    return "";
  });
}

function wordpressSlug(title: string): string {
  let slug = removeAccentsWordpress(title);
  slug = slug.replace(/%([a-fA-F0-9]{2})/g, "\u0000$1\u0000").replace(/%/g, "").replace(/\u0000([a-fA-F0-9]{2})\u0000/g, "%$1");
  slug = slug.toLocaleLowerCase("en");
  slug = utf8UriEncode(slug, 200);
  slug = dropEncodedPunctuation(slug);
  slug = slug.replaceAll("\u00a0", "-").replaceAll("\u2013", "-").replaceAll("\u2014", "-").replaceAll("\u2011", "-");
  slug = slug.replace(/&.+?;/g, "");
  slug = slug.replaceAll(".", "-");
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
  slug = slug.replace(/^-+/, "").replace(/-+$/, "");
  return slug;
}

function pythonSlugify(title: string): string {
  let text = title.replace(/'+/g, "-");
  let mapped = "";
  for (const ch of text.normalize("NFKD")) {
    if (Object.hasOwn(PYTHON_SPECIAL, ch)) mapped += PYTHON_SPECIAL[ch]!;
    else if (Object.hasOwn(PYTHON_CYRILLIC, ch)) mapped += PYTHON_CYRILLIC[ch]!;
    else mapped += ch;
  }
  text = mapped.normalize("NFKD").replace(/\p{M}/gu, "");
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
